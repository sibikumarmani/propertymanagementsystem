package com.company.pms.audit;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
public class AuditLogEntity extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id")
    private Long companyId;
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "user_name")
    private String userName;
    @Column(name = "action", nullable = false)
    private String action;
    @Column(name = "screen", nullable = false)
    private String screen;
    @Column(name = "entity_type")
    private String entityType;
    @Column(name = "entity_id")
    private Long entityId;
    @Column(name = "old_value", columnDefinition = "LONGTEXT")
    private String oldValue;
    @Column(name = "new_value", columnDefinition = "LONGTEXT")
    private String newValue;
    @Column(name = "ip_address")
    private String ipAddress;
    @Column(name = "action_at", nullable = false)
    private Instant actionAt;
}
