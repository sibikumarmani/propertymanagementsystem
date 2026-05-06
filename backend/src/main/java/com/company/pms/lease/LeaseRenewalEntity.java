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
@Table(name = "lease_renewals")
@Getter
@Setter
public class LeaseRenewalEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "lease_id", nullable = false)
    private Long leaseId;

    @Column(name = "renewal_number", nullable = false)
    private String renewalNumber;

    @Column(name = "previous_start_date", nullable = false)
    private LocalDate previousStartDate;

    @Column(name = "previous_end_date", nullable = false)
    private LocalDate previousEndDate;

    @Column(name = "new_start_date", nullable = false)
    private LocalDate newStartDate;

    @Column(name = "new_end_date", nullable = false)
    private LocalDate newEndDate;

    @Column(name = "previous_rent_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal previousRentAmount;

    @Column(name = "new_rent_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal newRentAmount;

    @Column(name = "security_deposit_amount", precision = 18, scale = 2)
    private BigDecimal securityDepositAmount;

    @Column(name = "agreement_document", columnDefinition = "LONGTEXT")
    private String agreementDocumentJson;

    @Column(name = "approval_status", nullable = false)
    private String approvalStatus;

    @Column(name = "renewal_notes", columnDefinition = "TEXT")
    private String renewalNotes;
}
