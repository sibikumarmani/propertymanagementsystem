package com.company.pms.notification;

public record ReminderRunResponse(
    String reminderType,
    int notificationsCreated
) {
}
