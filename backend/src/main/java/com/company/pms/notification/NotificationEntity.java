package com.company.pms.notification;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter
@Setter
public class NotificationEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "recipient_user_id")
    private Long recipientUserId;
    @Column(name = "recipient_name")
    private String recipientName;
    @Column(name = "recipient_email")
    private String recipientEmail;
    @Column(name = "recipient_phone")
    private String recipientPhone;
    @Column(name = "notification_type", nullable = false)
    private String notificationType;
    @Column(name = "title", nullable = false)
    private String title;
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;
    @Column(name = "entity_type")
    private String entityType;
    @Column(name = "entity_id")
    private Long entityId;
    @Column(name = "priority", nullable = false)
    private String priority;
    @Column(name = "read_at")
    private Instant readAt;
}
