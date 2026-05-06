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
@Table(name = "property_expenses")
@Getter
@Setter
@NoArgsConstructor
public class PropertyExpenseEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "expense_number", nullable = false)
    private String expenseNumber;
    @Column(name = "vendor_invoice_id")
    private Long vendorInvoiceId;
    @Column(name = "vendor_id")
    private Long vendorId;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;
    @Column(name = "expense_type", nullable = false)
    private String expenseType;
    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "approval_status", nullable = false)
    private String approvalStatus;
    @Column(name = "payment_status", nullable = false)
    private String paymentStatus;
    @Column(name = "status", nullable = false)
    private String status;
}
