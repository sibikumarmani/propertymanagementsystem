package com.company.pms.document;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "documents")
@Getter
@Setter
public class DocumentEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "document_number", nullable = false)
    private String documentNumber;

    @Column(name = "document_title", nullable = false)
    private String documentTitle;

    @Column(name = "document_type", nullable = false)
    private String documentType;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "data_url", nullable = false, columnDefinition = "LONGTEXT")
    private String dataUrl;

    @Column(name = "property_id")
    private Long propertyId;

    @Column(name = "unit_id")
    private Long unitId;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "lease_id")
    private Long leaseId;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "invoice_id")
    private Long invoiceId;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "previous_document_id")
    private Long previousDocumentId;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "access_level", nullable = false)
    private String accessLevel;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
