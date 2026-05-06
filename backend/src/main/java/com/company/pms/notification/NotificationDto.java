package com.company.pms.notification;

import java.time.Instant;
import java.util.List;

public record NotificationDto(
    Long id,
    Long companyId,
    Long recipientUserId,
    String recipientName,
    String recipientEmail,
    String recipientPhone,
    String notificationType,
    String title,
    String message,
    String entityType,
    Long entityId,
    String priority,
    Instant readAt,
    boolean read,
    List<NotificationDeliveryDto> deliveries
) {
}
