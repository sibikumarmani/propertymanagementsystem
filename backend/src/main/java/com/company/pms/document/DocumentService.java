package com.company.pms.document;

import com.company.pms.lease.LeaseEntity;
import com.company.pms.lease.LeaseRepository;
import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.rentbilling.InvoiceEntity;
import com.company.pms.rentbilling.InvoiceRepository;
import com.company.pms.security.SecurityContextService;
import com.company.pms.tenant.TenantEntity;
import com.company.pms.tenant.TenantRepository;
import com.company.pms.unit.UnitEntity;
import com.company.pms.unit.UnitRepository;
import com.company.pms.vendor.VendorEntity;
import com.company.pms.vendor.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private static final List<String> DOCUMENT_TYPES = List.of(
        "LEASE_AGREEMENT",
        "TENANT_ID_PROOF",
        "OWNER_DOCUMENT",
        "PROPERTY_TAX_DOCUMENT",
        "INSURANCE_DOCUMENT",
        "VENDOR_CONTRACT",
        "INVOICE_PDF",
        "RECEIPT_PDF"
    );

    private static final List<String> STATUSES = List.of("ACTIVE", "SUPERSEDED", "EXPIRED", "ARCHIVED");
    private static final List<String> ACCESS_LEVELS = List.of("INTERNAL", "RESTRICTED", "CONFIDENTIAL");

    private final DocumentRepository documentRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final TenantRepository tenantRepository;
    private final LeaseRepository leaseRepository;
    private final VendorRepository vendorRepository;
    private final InvoiceRepository invoiceRepository;
    private final SecurityContextService securityContextService;

    public DocumentService(
        DocumentRepository documentRepository,
        PropertyRepository propertyRepository,
        UnitRepository unitRepository,
        TenantRepository tenantRepository,
        LeaseRepository leaseRepository,
        VendorRepository vendorRepository,
        InvoiceRepository invoiceRepository,
        SecurityContextService securityContextService
    ) {
        this.documentRepository = documentRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.tenantRepository = tenantRepository;
        this.leaseRepository = leaseRepository;
        this.vendorRepository = vendorRepository;
        this.invoiceRepository = invoiceRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getDocuments() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return toDtos(companyId, documentRepository.findAllByCompanyIdOrderByUpdatedAtDescIdDesc(companyId));
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getExpiringDocuments(Integer days) {
        Long companyId = securityContextService.getCurrentCompanyId();
        int horizonDays = days == null ? 30 : Math.max(0, days);
        return toDtos(companyId, documentRepository.findAllByCompanyIdAndExpiryDateLessThanEqualOrderByExpiryDateAscIdAsc(companyId, LocalDate.now().plusDays(horizonDays)));
    }

    @Transactional(readOnly = true)
    public DocumentDto getDocument(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        DocumentEntity document = requireDocument(id, companyId);
        return toDtos(companyId, List.of(document)).get(0);
    }

    @Transactional(readOnly = true)
    public DocumentOptionsDto getOptions() {
        return new DocumentOptionsDto(DOCUMENT_TYPES, STATUSES, ACCESS_LEVELS);
    }

    @Transactional
    public DocumentDto createDocument(DocumentUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        DocumentEntity previous = null;
        int versionNumber = 1;
        if (request.previousDocumentId() != null) {
            previous = requireDocument(request.previousDocumentId(), companyId);
            versionNumber = previous.getVersionNumber() + 1;
        }

        String documentNumber = normalizeRequiredText(request.documentNumber(), "Document number").toUpperCase();
        if (documentRepository.existsByCompanyIdAndDocumentNumberIgnoreCaseAndVersionNumber(companyId, documentNumber, versionNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Document number and version already exist for the active company");
        }

        DocumentEntity document = apply(new DocumentEntity(), request, companyId, documentNumber, versionNumber);
        document.setPreviousDocumentId(previous == null ? null : previous.getId());
        DocumentEntity saved = documentRepository.save(document);
        if (previous != null && "ACTIVE".equals(previous.getStatus())) {
            previous.setStatus("SUPERSEDED");
            documentRepository.save(previous);
        }
        return getDocument(saved.getId());
    }

    @Transactional
    public DocumentDto updateDocument(Long id, DocumentUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        DocumentEntity document = requireDocument(id, companyId);
        String documentNumber = normalizeRequiredText(request.documentNumber(), "Document number").toUpperCase();
        DocumentEntity saved = documentRepository.save(apply(document, request, companyId, documentNumber, document.getVersionNumber()));
        return getDocument(saved.getId());
    }

    @Transactional
    public void deleteDocument(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        documentRepository.delete(requireDocument(id, companyId));
    }

    private DocumentEntity apply(DocumentEntity document, DocumentUpsertRequest request, Long companyId, String documentNumber, Integer versionNumber) {
        validateReferences(companyId, request);

        document.setCompanyId(companyId);
        document.setDocumentNumber(documentNumber);
        document.setDocumentTitle(normalizeRequiredText(request.documentTitle(), "Document title"));
        document.setDocumentType(normalizeChoice(request.documentType(), DOCUMENT_TYPES, "Document type"));
        document.setFileName(normalizeRequiredText(request.fileName(), "File name"));
        document.setContentType(normalizeRequiredText(request.contentType(), "Content type"));
        document.setFileSize(request.fileSize());
        document.setDataUrl(normalizeRequiredText(request.dataUrl(), "Document file"));
        document.setPropertyId(request.propertyId());
        document.setUnitId(request.unitId());
        document.setTenantId(request.tenantId());
        document.setLeaseId(request.leaseId());
        document.setVendorId(request.vendorId());
        document.setInvoiceId(request.invoiceId());
        document.setExpiryDate(request.expiryDate());
        document.setVersionNumber(versionNumber);
        document.setStatus(resolveStatus(request.status(), request.expiryDate()));
        document.setAccessLevel(normalizeChoice(request.accessLevel() == null ? "INTERNAL" : request.accessLevel(), ACCESS_LEVELS, "Access level"));
        document.setRemarks(normalizeText(request.remarks()));
        return document;
    }

    private void validateReferences(Long companyId, DocumentUpsertRequest request) {
        boolean hasMapping = request.propertyId() != null || request.unitId() != null || request.tenantId() != null || request.leaseId() != null || request.vendorId() != null || request.invoiceId() != null;
        if (!hasMapping) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Map the document to at least one property, unit, tenant, lease, vendor, or invoice");
        }
        if (request.propertyId() != null) {
            propertyRepository.findByIdAndCompanyId(request.propertyId(), companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Property does not belong to the active company"));
        }
        if (request.unitId() != null) {
            unitRepository.findByIdAndCompanyId(request.unitId(), companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit does not belong to the active company"));
        }
        if (request.tenantId() != null) {
            tenantRepository.findByIdAndCompanyId(request.tenantId(), companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant does not belong to the active company"));
        }
        if (request.leaseId() != null) {
            leaseRepository.findByIdAndCompanyId(request.leaseId(), companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lease does not belong to the active company"));
        }
        if (request.vendorId() != null) {
            vendorRepository.findByIdAndCompanyId(request.vendorId(), companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor does not belong to the active company"));
        }
        if (request.invoiceId() != null) {
            invoiceRepository.findByIdAndCompanyId(request.invoiceId(), companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invoice does not belong to the active company"));
        }
    }

    private List<DocumentDto> toDtos(Long companyId, List<DocumentEntity> documents) {
        Map<Long, PropertyEntity> properties = propertyRepository.findAllByCompanyIdOrderByPropertyNameAscIdAsc(companyId).stream().collect(Collectors.toMap(PropertyEntity::getId, Function.identity()));
        Map<Long, UnitEntity> units = unitRepository.findAllByCompanyIdOrderByUnitCodeAscIdAsc(companyId).stream().collect(Collectors.toMap(UnitEntity::getId, Function.identity()));
        Map<Long, TenantEntity> tenants = tenantRepository.findAllByCompanyIdOrderByTenantCodeAscIdAsc(companyId).stream().collect(Collectors.toMap(TenantEntity::getId, Function.identity()));
        Map<Long, LeaseEntity> leases = leaseRepository.findAllByCompanyIdOrderByLeaseNumberAscIdAsc(companyId).stream().collect(Collectors.toMap(LeaseEntity::getId, Function.identity()));
        Map<Long, VendorEntity> vendors = vendorRepository.findAllByCompanyIdOrderByVendorNameAscIdAsc(companyId).stream().collect(Collectors.toMap(VendorEntity::getId, Function.identity()));
        Map<Long, InvoiceEntity> invoices = invoiceRepository.findAllByCompanyIdOrderByInvoiceDateDescIdDesc(companyId).stream().collect(Collectors.toMap(InvoiceEntity::getId, Function.identity()));
        LocalDate today = LocalDate.now();

        return documents.stream()
            .map(document -> {
                PropertyEntity property = properties.get(document.getPropertyId());
                UnitEntity unit = units.get(document.getUnitId());
                TenantEntity tenant = tenants.get(document.getTenantId());
                LeaseEntity lease = leases.get(document.getLeaseId());
                VendorEntity vendor = vendors.get(document.getVendorId());
                InvoiceEntity invoice = invoices.get(document.getInvoiceId());
                boolean expired = document.getExpiryDate() != null && document.getExpiryDate().isBefore(today);
                boolean expiringSoon = document.getExpiryDate() != null && !expired && !document.getExpiryDate().isAfter(today.plusDays(30));
                return new DocumentDto(
                    document.getId(),
                    document.getCompanyId(),
                    document.getDocumentNumber(),
                    document.getDocumentTitle(),
                    document.getDocumentType(),
                    document.getFileName(),
                    document.getContentType(),
                    document.getFileSize(),
                    document.getDataUrl(),
                    document.getPropertyId(),
                    property == null ? null : property.getPropertyName(),
                    document.getUnitId(),
                    unit == null ? null : unit.getUnitNumber(),
                    document.getTenantId(),
                    tenant == null ? null : tenantDisplayName(tenant),
                    document.getLeaseId(),
                    lease == null ? null : lease.getLeaseNumber(),
                    document.getVendorId(),
                    vendor == null ? null : vendor.getVendorName(),
                    document.getInvoiceId(),
                    invoice == null ? null : invoice.getInvoiceNumber(),
                    document.getExpiryDate(),
                    document.getVersionNumber(),
                    document.getPreviousDocumentId(),
                    expired && "ACTIVE".equals(document.getStatus()) ? "EXPIRED" : document.getStatus(),
                    document.getAccessLevel(),
                    document.getRemarks(),
                    expired,
                    expiringSoon
                );
            })
            .toList();
    }

    private DocumentEntity requireDocument(Long id, Long companyId) {
        return documentRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
    }

    private String tenantDisplayName(TenantEntity tenant) {
        if (tenant.getCompanyName() != null && !tenant.getCompanyName().isBlank()) {
            return tenant.getCompanyName();
        }
        return List.of(tenant.getFirstName(), tenant.getLastName()).stream()
            .filter(Objects::nonNull)
            .filter(value -> !value.isBlank())
            .collect(Collectors.joining(" "));
    }

    private String resolveStatus(String requestedStatus, LocalDate expiryDate) {
        if (expiryDate != null && expiryDate.isBefore(LocalDate.now())) {
            return "EXPIRED";
        }
        return normalizeChoice(requestedStatus == null ? "ACTIVE" : requestedStatus, STATUSES, "Status");
    }

    private String normalizeChoice(String value, List<String> allowedValues, String label) {
        String normalized = normalizeRequiredText(value, label).toUpperCase();
        if (!allowedValues.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is invalid");
        }
        return normalized;
    }

    private String normalizeRequiredText(String value, String label) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        return normalized;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
