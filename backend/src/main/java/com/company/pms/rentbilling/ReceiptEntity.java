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
@Table(name = "receipts")
@Getter
@Setter
public class ReceiptEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "receipt_number", nullable = false)
    private String receiptNumber;
    @Column(name = "invoice_id")
    private Long invoiceId;
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    @Column(name = "receipt_date", nullable = false)
    private LocalDate receiptDate;
    @Column(name = "payment_mode", nullable = false)
    private String paymentMode;
    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;
    @Column(name = "advance_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal advanceAmount;
    @Column(name = "reference_number")
    private String referenceNumber;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    @Column(name = "pdf_document", columnDefinition = "LONGTEXT")
    private String pdfDocument;
    @Column(name = "status", nullable = false)
    private String status;
}
