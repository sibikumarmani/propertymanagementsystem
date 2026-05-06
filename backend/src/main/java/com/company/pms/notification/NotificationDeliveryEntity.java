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
@Table(name = "notification_deliveries")
@Getter
@Setter
public class NotificationDeliveryEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "notification_id", nullable = false)
    private Long notificationId;
    @Column(name = "channel", nullable = false)
    private String channel;
    @Column(name = "destination")
    private String destination;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "provider_message", columnDefinition = "TEXT")
    private String providerMessage;
    @Column(name = "attempted_at")
    private Instant attemptedAt;
}
