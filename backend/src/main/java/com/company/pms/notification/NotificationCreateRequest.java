package com.company.pms.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record NotificationCreateRequest(
    Long recipientUserId,
    String recipientName,
    String recipientEmail,
    String recipientPhone,
    @NotBlank String notificationType,
    @NotBlank String title,
    @NotBlank String message,
    String entityType,
    Long entityId,
    String priority,
    @NotEmpty List<String> channels
) {
}
