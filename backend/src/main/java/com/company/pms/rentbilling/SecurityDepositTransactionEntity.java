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
@Table(name = "security_deposit_transactions")
@Getter
@Setter
public class SecurityDepositTransactionEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "security_deposit_id", nullable = false)
    private Long securityDepositId;
    @Column(name = "transaction_type", nullable = false)
    private String transactionType;
    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;
    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;
    @Column(name = "invoice_id")
    private Long invoiceId;
    @Column(name = "receipt_id")
    private Long receiptId;
    @Column(name = "reference_number")
    private String referenceNumber;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
