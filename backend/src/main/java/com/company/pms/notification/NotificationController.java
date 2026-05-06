package com.company.pms.notification;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("@menuAccessGuard.hasAccess('notifications')")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<NotificationDto>> getNotifications() {
        return ApiResponse.ok(notificationService.getNotifications());
    }

    @GetMapping("/me")
    public ApiResponse<List<NotificationDto>> getMyNotifications() {
        return ApiResponse.ok(notificationService.getMyNotifications());
    }

    @GetMapping("/options")
    public ApiResponse<NotificationOptionsDto> getOptions() {
        return ApiResponse.ok(notificationService.getOptions());
    }

    @PostMapping
    public ApiResponse<NotificationDto> createNotification(@Valid @RequestBody NotificationCreateRequest request) {
        return ApiResponse.ok(notificationService.createNotification(request));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<NotificationDto> markRead(@PathVariable Long id) {
        return ApiResponse.ok(notificationService.markRead(id));
    }

    @PostMapping("/reminders/rent-due")
    public ApiResponse<ReminderRunResponse> runRentDueReminders(@RequestParam(required = false) Integer days) {
        return ApiResponse.ok(notificationService.runRentDueReminders(days));
    }

    @PostMapping("/reminders/lease-expiry")
    public ApiResponse<ReminderRunResponse> runLeaseExpiryReminders(@RequestParam(required = false) Integer days) {
        return ApiResponse.ok(notificationService.runLeaseExpiryReminders(days));
    }
}
