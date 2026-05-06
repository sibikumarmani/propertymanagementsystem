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

@Entity
@Table(name = "security_deposits")
@Getter
@Setter
public class SecurityDepositEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "lease_id", nullable = false)
    private Long leaseId;
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "unit_id", nullable = false)
    private Long unitId;
    @Column(name = "deposit_number", nullable = false)
    private String depositNumber;
    @Column(name = "deposit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal depositAmount;
    @Column(name = "collected_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal collectedAmount;
    @Column(name = "adjusted_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal adjustedAmount;
    @Column(name = "refunded_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal refundedAmount;
    @Column(name = "refundable_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal refundableAmount;
    @Column(name = "deposit_invoice_id")
    private Long depositInvoiceId;
    @Column(name = "deposit_receipt_id")
    private Long depositReceiptId;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
