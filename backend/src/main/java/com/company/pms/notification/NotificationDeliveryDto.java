package com.company.pms.notification;

import java.time.Instant;

public record NotificationDeliveryDto(
    Long id,
    String channel,
    String destination,
    String status,
    String providerMessage,
    Instant attemptedAt
) {
}
