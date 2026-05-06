package com.company.pms.accounting;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "accounting_entries")
@Getter
@Setter
public class AccountingEntryEntity extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;
    @Column(name = "account_type", nullable = false)
    private String accountType;
    @Column(name = "party_type")
    private String partyType;
    @Column(name = "party_id")
    private Long partyId;
    @Column(name = "property_id")
    private Long propertyId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "source_type", nullable = false)
    private String sourceType;
    @Column(name = "source_id", nullable = false)
    private Long sourceId;
    @Column(name = "source_reference", nullable = false)
    private String sourceReference;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "debit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal debitAmount;
    @Column(name = "credit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal creditAmount;
    @Column(name = "reconciled", nullable = false)
    private Boolean reconciled;
}
