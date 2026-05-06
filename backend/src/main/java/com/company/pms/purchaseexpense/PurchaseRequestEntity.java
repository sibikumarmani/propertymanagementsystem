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

@Entity
@Table(name = "purchase_requests")
@Getter
@Setter
@NoArgsConstructor
public class PurchaseRequestEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "request_number", nullable = false)
    private String requestNumber;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "expense_type", nullable = false)
    private String expenseType;
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;
    @Column(name = "estimated_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal estimatedAmount;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "approval_status", nullable = false)
    private String approvalStatus;
}
