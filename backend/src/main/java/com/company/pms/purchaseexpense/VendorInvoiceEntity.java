package com.company.pms.purchaseexpense;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vendor_invoices")
@Getter
@Setter
@NoArgsConstructor
public class VendorInvoiceEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;
    @Column(name = "purchase_order_id")
    private Long purchaseOrderId;
    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Column(name = "invoice_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal invoiceAmount;
    @Column(name = "paid_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal paidAmount;
    @Column(name = "payment_status", nullable = false)
    private String paymentStatus;
    @Column(name = "approval_status", nullable = false)
    private String approvalStatus;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
