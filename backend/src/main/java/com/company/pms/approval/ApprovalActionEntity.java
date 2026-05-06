package com.company.pms.approval;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "approval_actions")
@Getter
@Setter
public class ApprovalActionEntity extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "approval_request_id", nullable = false)
    private Long approvalRequestId;
    @Column(name = "level_no", nullable = false)
    private Integer levelNo;
    @Column(name = "action", nullable = false)
    private String action;
    @Column(name = "approver_user_id")
    private Long approverUserId;
    @Column(name = "approver_role_id")
    private Long approverRoleId;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    @Column(name = "action_at", nullable = false)
    private Instant actionAt;
}
