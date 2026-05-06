package com.company.pms.owner;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "owners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "owner_code", nullable = false)
    private String ownerCode;

    @Column(name = "owner_name", nullable = false)
    private String ownerName;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "tax_details", columnDefinition = "TEXT")
    private String taxDetails;

    @Column(name = "bank_account_details", columnDefinition = "TEXT")
    private String bankAccountDetails;

    @Column(name = "ownership_percentage", precision = 5, scale = 2)
    private BigDecimal ownershipPercentage;

    @Column(name = "payout_frequency", nullable = false)
    private String payoutFrequency;

    @Column(name = "statement_preference", nullable = false)
    private String statementPreference;

    @Column(name = "owner_status", nullable = false)
    private String ownerStatus;

    @Column(name = "statement_stage", nullable = false)
    private String statementStage;
}
