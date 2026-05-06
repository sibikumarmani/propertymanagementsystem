package com.company.pms.rentbilling;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "invoices")
@Getter
@Setter
public class InvoiceEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;
    @Column(name = "invoice_type", nullable = false)
    private String invoiceType;
    @Column(name = "lease_id")
    private Long leaseId;
    @Column(name = "rent_schedule_id")
    private Long rentScheduleId;
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    @Column(name = "property_id")
    private Long propertyId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Column(name = "subtotal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotalAmount;
    @Column(name = "tax_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxAmount;
    @Column(name = "discount_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal discountAmount;
    @Column(name = "late_fee_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal lateFeeAmount;
    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;
    @Column(name = "paid_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal paidAmount;
    @Column(name = "due_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal dueAmount;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "pdf_document", columnDefinition = "LONGTEXT")
    private String pdfDocument;
}
