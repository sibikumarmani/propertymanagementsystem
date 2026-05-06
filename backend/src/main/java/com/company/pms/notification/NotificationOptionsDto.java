package com.company.pms.notification;

import java.util.List;

public record NotificationOptionsDto(
    List<String> notificationTypes,
    List<String> channels,
    List<String> priorities
) {
}
