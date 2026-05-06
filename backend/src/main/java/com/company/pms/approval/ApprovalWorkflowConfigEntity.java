package com.company.pms.approval;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "approval_workflow_configs")
@Getter
@Setter
public class ApprovalWorkflowConfigEntity extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "transaction_type", nullable = false)
    private String transactionType;
    @Column(name = "level_no", nullable = false)
    private Integer levelNo;
    @Column(name = "approver_role_id", nullable = false)
    private Long approverRoleId;
    @Column(name = "min_amount", precision = 18, scale = 2)
    private BigDecimal minAmount;
    @Column(name = "max_amount", precision = 18, scale = 2)
    private BigDecimal maxAmount;
    @Column(name = "active", nullable = false)
    private Boolean active;
}
