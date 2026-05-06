package com.company.pms.approval;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "approval_requests")
@Getter
@Setter
public class ApprovalRequestEntity extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "transaction_type", nullable = false)
    private String transactionType;
    @Column(name = "entity_id", nullable = false)
    private Long entityId;
    @Column(name = "reference_number", nullable = false)
    private String referenceNumber;
    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "current_level", nullable = false)
    private Integer currentLevel;
    @Column(name = "requested_by")
    private Long requestedBy;
    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;
    @Column(name = "completed_at")
    private Instant completedAt;
    @Column(name = "requester_remarks", columnDefinition = "TEXT")
    private String requesterRemarks;
    @Column(name = "final_remarks", columnDefinition = "TEXT")
    private String finalRemarks;
}
