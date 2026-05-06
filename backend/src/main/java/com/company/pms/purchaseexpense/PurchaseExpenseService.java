package com.company.pms.purchaseexpense;

import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.security.SecurityContextService;
import com.company.pms.unit.UnitEntity;
import com.company.pms.unit.UnitRepository;
import com.company.pms.vendor.VendorEntity;
import com.company.pms.vendor.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
public class PurchaseExpenseService {

    private static final List<String> EXPENSE_TYPES = List.of("REPAIR_EXPENSE", "CLEANING_EXPENSE", "SECURITY_EXPENSE", "UTILITY_EXPENSE", "MANAGEMENT_FEE", "INSURANCE", "TAX", "COMMON_AREA_MAINTENANCE");
    private static final List<String> REQUEST_STATUSES = List.of("DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ORDERED", "CANCELLED");
    private static final List<String> ORDER_STATUSES = List.of("DRAFT", "SUBMITTED", "APPROVED", "ISSUED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED");
    private static final List<String> INVOICE_STATUSES = List.of("DRAFT", "SUBMITTED", "APPROVED", "POSTED", "CANCELLED");
    private static final List<String> EXPENSE_STATUSES = List.of("RECORDED", "APPROVED", "POSTED", "CANCELLED");
    private static final List<String> APPROVAL_STATUSES = List.of("PENDING_APPROVAL", "APPROVED", "REJECTED", "NOT_REQUIRED");
    private static final List<String> PAYMENT_STATUSES = List.of("UNPAID", "PARTIALLY_PAID", "PAID", "ON_HOLD", "CANCELLED");

    private final PurchaseRequestRepository requestRepository;
    private final PurchaseOrderRepository orderRepository;
    private final VendorInvoiceRepository invoiceRepository;
    private final PropertyExpenseRepository expenseRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final VendorRepository vendorRepository;
    private final SecurityContextService securityContextService;

    public PurchaseExpenseService(PurchaseRequestRepository requestRepository, PurchaseOrderRepository orderRepository, VendorInvoiceRepository invoiceRepository, PropertyExpenseRepository expenseRepository, PropertyRepository propertyRepository, UnitRepository unitRepository, VendorRepository vendorRepository, SecurityContextService securityContextService) {
        this.requestRepository = requestRepository;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.vendorRepository = vendorRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public PurchaseExpenseOptionsDto getOptions() {
        return new PurchaseExpenseOptionsDto(EXPENSE_TYPES, REQUEST_STATUSES, ORDER_STATUSES, INVOICE_STATUSES, EXPENSE_STATUSES, APPROVAL_STATUSES, PAYMENT_STATUSES);
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestDto> getRequests() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return requestRepository.findAllByCompanyIdOrderByIdDesc(companyId).stream().map(this::toDto).toList();
    }

    @Transactional
    public PurchaseRequestDto createRequest(PurchaseRequestUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String number = normalizeCode(request.requestNumber(), "Request number");
        if (requestRepository.existsByCompanyIdAndRequestNumberIgnoreCase(companyId, number)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Purchase request number already exists");
        }
        validatePropertyUnit(request.propertyId(), request.unitId(), companyId);
        PurchaseRequestEntity saved = requestRepository.save(apply(new PurchaseRequestEntity(), request, companyId, number));
        return toDto(saved);
    }

    @Transactional
    public PurchaseRequestDto updateRequest(Long id, PurchaseRequestUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PurchaseRequestEntity entity = requestRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Purchase request"));
        String number = normalizeCode(request.requestNumber(), "Request number");
        if (requestRepository.existsByCompanyIdAndRequestNumberIgnoreCaseAndIdNot(companyId, number, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Purchase request number already exists");
        }
        validatePropertyUnit(request.propertyId(), request.unitId(), companyId);
        return toDto(requestRepository.save(apply(entity, request, companyId, number)));
    }

    @Transactional
    public void deleteRequest(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        requestRepository.delete(requestRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Purchase request")));
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderDto> getOrders() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return orderRepository.findAllByCompanyIdOrderByIdDesc(companyId).stream().map(this::toDto).toList();
    }

    @Transactional
    public PurchaseOrderDto createOrder(PurchaseOrderUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String number = normalizeCode(request.purchaseOrderNumber(), "Purchase order number");
        if (orderRepository.existsByCompanyIdAndPurchaseOrderNumberIgnoreCase(companyId, number)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Purchase order number already exists");
        }
        validateOrderLinks(request, companyId);
        return toDto(orderRepository.save(apply(new PurchaseOrderEntity(), request, companyId, number)));
    }

    @Transactional
    public PurchaseOrderDto updateOrder(Long id, PurchaseOrderUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PurchaseOrderEntity entity = orderRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Purchase order"));
        String number = normalizeCode(request.purchaseOrderNumber(), "Purchase order number");
        if (orderRepository.existsByCompanyIdAndPurchaseOrderNumberIgnoreCaseAndIdNot(companyId, number, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Purchase order number already exists");
        }
        validateOrderLinks(request, companyId);
        return toDto(orderRepository.save(apply(entity, request, companyId, number)));
    }

    @Transactional
    public void deleteOrder(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        orderRepository.delete(orderRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Purchase order")));
    }

    @Transactional(readOnly = true)
    public List<VendorInvoiceDto> getInvoices() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return invoiceRepository.findAllByCompanyIdOrderByIdDesc(companyId).stream().map(this::toDto).toList();
    }

    @Transactional
    public VendorInvoiceDto createInvoice(VendorInvoiceUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String number = normalizeCode(request.invoiceNumber(), "Invoice number");
        if (invoiceRepository.existsByCompanyIdAndInvoiceNumberIgnoreCase(companyId, number)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor invoice number already exists");
        }
        validateInvoiceLinks(request, companyId);
        return toDto(invoiceRepository.save(apply(new VendorInvoiceEntity(), request, companyId, number)));
    }

    @Transactional
    public VendorInvoiceDto updateInvoice(Long id, VendorInvoiceUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        VendorInvoiceEntity entity = invoiceRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Vendor invoice"));
        String number = normalizeCode(request.invoiceNumber(), "Invoice number");
        if (invoiceRepository.existsByCompanyIdAndInvoiceNumberIgnoreCaseAndIdNot(companyId, number, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor invoice number already exists");
        }
        validateInvoiceLinks(request, companyId);
        return toDto(invoiceRepository.save(apply(entity, request, companyId, number)));
    }

    @Transactional
    public void deleteInvoice(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        invoiceRepository.delete(invoiceRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Vendor invoice")));
    }

    @Transactional(readOnly = true)
    public List<PropertyExpenseDto> getExpenses() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return expenseRepository.findAllByCompanyIdOrderByExpenseDateDescIdDesc(companyId).stream().map(this::toDto).toList();
    }

    @Transactional
    public PropertyExpenseDto createExpense(PropertyExpenseUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String number = normalizeCode(request.expenseNumber(), "Expense number");
        if (expenseRepository.existsByCompanyIdAndExpenseNumberIgnoreCase(companyId, number)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Expense number already exists");
        }
        validateExpenseLinks(request, companyId);
        return toDto(expenseRepository.save(apply(new PropertyExpenseEntity(), request, companyId, number)));
    }

    @Transactional
    public PropertyExpenseDto updateExpense(Long id, PropertyExpenseUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PropertyExpenseEntity entity = expenseRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Property expense"));
        String number = normalizeCode(request.expenseNumber(), "Expense number");
        if (expenseRepository.existsByCompanyIdAndExpenseNumberIgnoreCaseAndIdNot(companyId, number, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Expense number already exists");
        }
        validateExpenseLinks(request, companyId);
        return toDto(expenseRepository.save(apply(entity, request, companyId, number)));
    }

    @Transactional
    public void deleteExpense(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        expenseRepository.delete(expenseRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Property expense")));
    }

    private PurchaseRequestEntity apply(PurchaseRequestEntity entity, PurchaseRequestUpsertRequest request, Long companyId, String number) {
        entity.setCompanyId(companyId);
        entity.setRequestNumber(number);
        entity.setPropertyId(request.propertyId());
        entity.setUnitId(request.unitId());
        entity.setExpenseType(choice(request.expenseType(), EXPENSE_TYPES, "Expense type"));
        entity.setDescription(required(request.description(), "Description"));
        entity.setEstimatedAmount(nonNegative(request.estimatedAmount(), "Estimated amount"));
        entity.setStatus(choice(request.status(), REQUEST_STATUSES, "Request status"));
        entity.setApprovalStatus(choice(request.approvalStatus(), APPROVAL_STATUSES, "Approval status"));
        return entity;
    }

    private PurchaseOrderEntity apply(PurchaseOrderEntity entity, PurchaseOrderUpsertRequest request, Long companyId, String number) {
        entity.setCompanyId(companyId);
        entity.setPurchaseOrderNumber(number);
        entity.setPurchaseRequestId(request.purchaseRequestId());
        entity.setVendorId(request.vendorId());
        entity.setPropertyId(request.propertyId());
        entity.setUnitId(request.unitId());
        entity.setOrderDate(request.orderDate());
        entity.setExpectedDeliveryDate(request.expectedDeliveryDate());
        entity.setTotalAmount(nonNegative(request.totalAmount(), "Total amount"));
        entity.setStatus(choice(request.status(), ORDER_STATUSES, "Order status"));
        entity.setApprovalStatus(choice(request.approvalStatus(), APPROVAL_STATUSES, "Approval status"));
        entity.setRemarks(text(request.remarks()));
        return entity;
    }

    private VendorInvoiceEntity apply(VendorInvoiceEntity entity, VendorInvoiceUpsertRequest request, Long companyId, String number) {
        entity.setCompanyId(companyId);
        entity.setInvoiceNumber(number);
        entity.setPurchaseOrderId(request.purchaseOrderId());
        entity.setVendorId(request.vendorId());
        entity.setPropertyId(request.propertyId());
        entity.setUnitId(request.unitId());
        entity.setInvoiceDate(request.invoiceDate());
        entity.setDueDate(request.dueDate());
        entity.setInvoiceAmount(nonNegative(request.invoiceAmount(), "Invoice amount"));
        entity.setPaidAmount(nonNegative(request.paidAmount(), "Paid amount"));
        if (entity.getPaidAmount().compareTo(entity.getInvoiceAmount()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paid amount cannot exceed invoice amount");
        }
        entity.setPaymentStatus(choice(request.paymentStatus(), PAYMENT_STATUSES, "Payment status"));
        entity.setApprovalStatus(choice(request.approvalStatus(), APPROVAL_STATUSES, "Approval status"));
        entity.setStatus(choice(request.status(), INVOICE_STATUSES, "Invoice status"));
        entity.setRemarks(text(request.remarks()));
        return entity;
    }

    private PropertyExpenseEntity apply(PropertyExpenseEntity entity, PropertyExpenseUpsertRequest request, Long companyId, String number) {
        entity.setCompanyId(companyId);
        entity.setExpenseNumber(number);
        entity.setVendorInvoiceId(request.vendorInvoiceId());
        entity.setVendorId(request.vendorId());
        entity.setPropertyId(request.propertyId());
        entity.setUnitId(request.unitId());
        entity.setExpenseDate(request.expenseDate());
        entity.setExpenseType(choice(request.expenseType(), EXPENSE_TYPES, "Expense type"));
        entity.setAmount(nonNegative(request.amount(), "Amount"));
        entity.setDescription(text(request.description()));
        entity.setApprovalStatus(choice(request.approvalStatus(), APPROVAL_STATUSES, "Approval status"));
        entity.setPaymentStatus(choice(request.paymentStatus(), PAYMENT_STATUSES, "Payment status"));
        entity.setStatus(choice(request.status(), EXPENSE_STATUSES, "Expense status"));
        return entity;
    }

    private PurchaseRequestDto toDto(PurchaseRequestEntity entity) {
        PropertyEntity property = propertyRepository.findById(entity.getPropertyId()).orElse(null);
        UnitEntity unit = entity.getUnitId() == null ? null : unitRepository.findById(entity.getUnitId()).orElse(null);
        return new PurchaseRequestDto(entity.getId(), entity.getCompanyId(), entity.getRequestNumber(), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getExpenseType(), entity.getDescription(), entity.getEstimatedAmount(), entity.getStatus(), entity.getApprovalStatus());
    }

    private PurchaseOrderDto toDto(PurchaseOrderEntity entity) {
        PurchaseRequestEntity request = entity.getPurchaseRequestId() == null ? null : requestRepository.findById(entity.getPurchaseRequestId()).orElse(null);
        VendorEntity vendor = vendorRepository.findById(entity.getVendorId()).orElse(null);
        PropertyEntity property = propertyRepository.findById(entity.getPropertyId()).orElse(null);
        UnitEntity unit = entity.getUnitId() == null ? null : unitRepository.findById(entity.getUnitId()).orElse(null);
        return new PurchaseOrderDto(entity.getId(), entity.getCompanyId(), entity.getPurchaseOrderNumber(), entity.getPurchaseRequestId(), request == null ? null : request.getRequestNumber(), entity.getVendorId(), vendor == null ? null : vendor.getVendorName(), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getOrderDate(), entity.getExpectedDeliveryDate(), entity.getTotalAmount(), entity.getStatus(), entity.getApprovalStatus(), entity.getRemarks());
    }

    private VendorInvoiceDto toDto(VendorInvoiceEntity entity) {
        PurchaseOrderEntity order = entity.getPurchaseOrderId() == null ? null : orderRepository.findById(entity.getPurchaseOrderId()).orElse(null);
        VendorEntity vendor = vendorRepository.findById(entity.getVendorId()).orElse(null);
        PropertyEntity property = propertyRepository.findById(entity.getPropertyId()).orElse(null);
        UnitEntity unit = entity.getUnitId() == null ? null : unitRepository.findById(entity.getUnitId()).orElse(null);
        return new VendorInvoiceDto(entity.getId(), entity.getCompanyId(), entity.getInvoiceNumber(), entity.getPurchaseOrderId(), order == null ? null : order.getPurchaseOrderNumber(), entity.getVendorId(), vendor == null ? null : vendor.getVendorName(), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getInvoiceDate(), entity.getDueDate(), entity.getInvoiceAmount(), entity.getPaidAmount(), entity.getInvoiceAmount().subtract(entity.getPaidAmount()), entity.getPaymentStatus(), entity.getApprovalStatus(), entity.getStatus(), entity.getRemarks());
    }

    private PropertyExpenseDto toDto(PropertyExpenseEntity entity) {
        VendorInvoiceEntity invoice = entity.getVendorInvoiceId() == null ? null : invoiceRepository.findById(entity.getVendorInvoiceId()).orElse(null);
        VendorEntity vendor = entity.getVendorId() == null ? null : vendorRepository.findById(entity.getVendorId()).orElse(null);
        PropertyEntity property = propertyRepository.findById(entity.getPropertyId()).orElse(null);
        UnitEntity unit = entity.getUnitId() == null ? null : unitRepository.findById(entity.getUnitId()).orElse(null);
        return new PropertyExpenseDto(entity.getId(), entity.getCompanyId(), entity.getExpenseNumber(), entity.getVendorInvoiceId(), invoice == null ? null : invoice.getInvoiceNumber(), entity.getVendorId(), vendor == null ? null : vendor.getVendorName(), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getExpenseDate(), entity.getExpenseType(), entity.getAmount(), entity.getDescription(), entity.getApprovalStatus(), entity.getPaymentStatus(), entity.getStatus());
    }

    private void validateOrderLinks(PurchaseOrderUpsertRequest request, Long companyId) {
        validatePropertyUnit(request.propertyId(), request.unitId(), companyId);
        requireVendor(request.vendorId(), companyId);
        if (request.purchaseRequestId() != null) {
            requestRepository.findByIdAndCompanyId(request.purchaseRequestId(), companyId).orElseThrow(() -> bad("Selected purchase request was not found in the active company"));
        }
    }

    private void validateInvoiceLinks(VendorInvoiceUpsertRequest request, Long companyId) {
        validatePropertyUnit(request.propertyId(), request.unitId(), companyId);
        requireVendor(request.vendorId(), companyId);
        if (request.purchaseOrderId() != null) {
            orderRepository.findByIdAndCompanyId(request.purchaseOrderId(), companyId).orElseThrow(() -> bad("Selected purchase order was not found in the active company"));
        }
    }

    private void validateExpenseLinks(PropertyExpenseUpsertRequest request, Long companyId) {
        validatePropertyUnit(request.propertyId(), request.unitId(), companyId);
        if (request.vendorId() != null) {
            requireVendor(request.vendorId(), companyId);
        }
        if (request.vendorInvoiceId() != null) {
            invoiceRepository.findByIdAndCompanyId(request.vendorInvoiceId(), companyId).orElseThrow(() -> bad("Selected vendor invoice was not found in the active company"));
        }
    }

    private void validatePropertyUnit(Long propertyId, Long unitId, Long companyId) {
        PropertyEntity property = propertyRepository.findByIdAndCompanyId(propertyId, companyId).orElseThrow(() -> bad("Selected property was not found in the active company"));
        if (unitId != null) {
            UnitEntity unit = unitRepository.findByIdAndCompanyId(unitId, companyId).orElseThrow(() -> bad("Selected unit was not found in the active company"));
            if (!property.getId().equals(unit.getPropertyId())) {
                throw bad("Selected unit does not belong to the selected property");
            }
        }
    }

    private VendorEntity requireVendor(Long vendorId, Long companyId) {
        return vendorRepository.findByIdAndCompanyId(vendorId, companyId).orElseThrow(() -> bad("Selected vendor was not found in the active company"));
    }

    private BigDecimal nonNegative(BigDecimal value, String label) {
        BigDecimal normalized = value == null ? BigDecimal.ZERO : value;
        if (normalized.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " cannot be negative");
        }
        return normalized;
    }

    private String choice(String value, List<String> allowed, String label) {
        String normalized = required(value, label).toUpperCase(Locale.ENGLISH);
        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is invalid");
        }
        return normalized;
    }

    private String normalizeCode(String value, String label) {
        return required(value, label).toUpperCase(Locale.ENGLISH);
    }

    private String required(String value, String label) {
        String normalized = text(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        return normalized;
    }

    private String text(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ResponseStatusException notFound(String label) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, label + " not found");
    }

    private ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
