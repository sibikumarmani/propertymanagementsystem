package com.company.pms.lease;

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
@Table(name = "leases")
@Getter
@Setter
public class LeaseEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "lease_number", nullable = false)
    private String leaseNumber;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "unit_id", nullable = false)
    private Long unitId;

    @Column(name = "lease_start_date", nullable = false)
    private LocalDate leaseStartDate;

    @Column(name = "lease_end_date", nullable = false)
    private LocalDate leaseEndDate;

    @Column(name = "rent_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal rentAmount;

    @Column(name = "security_deposit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal securityDepositAmount;

    @Column(name = "billing_cycle", nullable = false)
    private String billingCycle;

    @Column(name = "due_day", nullable = false)
    private Integer dueDay;

    @Column(name = "grace_period_days")
    private Integer gracePeriodDays;

    @Column(name = "late_fee_rule")
    private String lateFeeRule;

    @Column(name = "agreement_document", columnDefinition = "LONGTEXT")
    private String agreementDocumentJson;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "activation_date")
    private LocalDate activationDate;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @Column(name = "termination_reason", columnDefinition = "TEXT")
    private String terminationReason;

    @Column(name = "final_settlement_amount", precision = 18, scale = 2)
    private BigDecimal finalSettlementAmount;

    @Column(name = "security_deposit_refund_amount", precision = 18, scale = 2)
    private BigDecimal securityDepositRefundAmount;

    @Column(name = "termination_document", columnDefinition = "LONGTEXT")
    private String terminationDocumentJson;

    @Column(name = "renewed_from_lease_id")
    private Long renewedFromLeaseId;
}
