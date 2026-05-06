package com.company.pms.notification;

import com.company.pms.auth.UserCompanyEntity;
import com.company.pms.auth.UserCompanyRepository;
import com.company.pms.auth.UserEntity;
import com.company.pms.auth.UserRepository;
import com.company.pms.lease.LeaseEntity;
import com.company.pms.lease.LeaseRepository;
import com.company.pms.rentbilling.RentScheduleEntity;
import com.company.pms.rentbilling.RentScheduleRepository;
import com.company.pms.security.SecurityContextService;
import com.company.pms.tenant.TenantEntity;
import com.company.pms.tenant.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private static final List<String> NOTIFICATION_TYPES = List.of(
        "RENT_DUE_REMINDER",
        "LEASE_EXPIRY_REMINDER",
        "MAINTENANCE_STATUS_UPDATE",
        "PAYMENT_CONFIRMATION",
        "APPROVAL_NOTIFICATION"
    );
    private static final List<String> CHANNELS = List.of("IN_APP", "EMAIL", "SMS", "WHATSAPP");
    private static final List<String> PRIORITIES = List.of("LOW", "NORMAL", "HIGH", "URGENT");

    private final NotificationRepository notificationRepository;
    private final NotificationDeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final RentScheduleRepository rentScheduleRepository;
    private final LeaseRepository leaseRepository;
    private final TenantRepository tenantRepository;
    private final SecurityContextService securityContextService;
    private final EmailSenderService emailSenderService;

    public NotificationService(
        NotificationRepository notificationRepository,
        NotificationDeliveryRepository deliveryRepository,
        UserRepository userRepository,
        UserCompanyRepository userCompanyRepository,
        RentScheduleRepository rentScheduleRepository,
        LeaseRepository leaseRepository,
        TenantRepository tenantRepository,
        SecurityContextService securityContextService,
        EmailSenderService emailSenderService
    ) {
        this.notificationRepository = notificationRepository;
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
        this.userCompanyRepository = userCompanyRepository;
        this.rentScheduleRepository = rentScheduleRepository;
        this.leaseRepository = leaseRepository;
        this.tenantRepository = tenantRepository;
        this.securityContextService = securityContextService;
        this.emailSenderService = emailSenderService;
    }

    @Transactional(readOnly = true)
    public NotificationOptionsDto getOptions() {
        return new NotificationOptionsDto(NOTIFICATION_TYPES, CHANNELS, PRIORITIES);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotifications() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return toDtos(notificationRepository.findAllByCompanyIdOrderByCreatedAtDescIdDesc(companyId));
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getMyNotifications() {
        Long companyId = securityContextService.getCurrentCompanyId();
        Long userId = securityContextService.getCurrentAuthenticatedUser().userId();
        return toDtos(notificationRepository.findAllByCompanyIdAndRecipientUserIdOrderByCreatedAtDescIdDesc(companyId, userId));
    }

    @Transactional
    public NotificationDto createNotification(NotificationCreateRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        return toDtos(List.of(createNotification(companyId, request))).get(0);
    }

    @Transactional
    public NotificationDto markRead(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        NotificationEntity notification = requireNotification(id, companyId);
        notification.setReadAt(Instant.now());
        return toDtos(List.of(notificationRepository.save(notification))).get(0);
    }

    @Transactional
    public ReminderRunResponse runRentDueReminders(Integer days) {
        Long companyId = securityContextService.getCurrentCompanyId();
        int horizon = days == null ? 7 : Math.max(0, days);
        LocalDate today = LocalDate.now();
        List<RentScheduleEntity> schedules = rentScheduleRepository.findAllByCompanyIdAndDueDateBetweenAndStatusInOrderByDueDateAscIdAsc(
            companyId,
            today,
            today.plusDays(horizon),
            List.of("PENDING", "PARTIALLY_PAID", "OVERDUE")
        );
        Map<Long, TenantEntity> tenants = tenantRepository.findAllById(schedules.stream().map(RentScheduleEntity::getTenantId).distinct().toList()).stream()
            .collect(Collectors.toMap(TenantEntity::getId, Function.identity()));
        List<UserEntity> companyUsers = activeCompanyUsers(companyId);
        int created = 0;
        for (RentScheduleEntity schedule : schedules) {
            TenantEntity tenant = tenants.get(schedule.getTenantId());
            String title = "Rent due reminder";
            String message = "Rent schedule %s is due on %s with due amount %s.".formatted(schedule.getScheduleNumber(), schedule.getDueDate(), schedule.getDueAmount());
            created += notifyCompanyUsers(companyId, companyUsers, "RENT_DUE_REMINDER", title, message, "RENT_SCHEDULE", schedule.getId(), "HIGH", List.of("IN_APP", "EMAIL"));
            if (tenant != null && tenant.getEmail() != null) {
                createNotification(companyId, new NotificationCreateRequest(null, tenantDisplayName(tenant), tenant.getEmail(), tenant.getPhoneNumber(), "RENT_DUE_REMINDER", title, message, "RENT_SCHEDULE", schedule.getId(), "HIGH", List.of("EMAIL", "SMS")));
                created++;
            }
        }
        return new ReminderRunResponse("RENT_DUE_REMINDER", created);
    }

    @Transactional
    public ReminderRunResponse runLeaseExpiryReminders(Integer days) {
        Long companyId = securityContextService.getCurrentCompanyId();
        int horizon = days == null ? 30 : Math.max(0, days);
        LocalDate today = LocalDate.now();
        List<LeaseEntity> leases = leaseRepository.findAllByCompanyIdAndLeaseEndDateBetweenAndStatusInOrderByLeaseEndDateAscIdAsc(
            companyId,
            today,
            today.plusDays(horizon),
            List.of("ACTIVE", "APPROVED")
        );
        Map<Long, TenantEntity> tenants = tenantRepository.findAllById(leases.stream().map(LeaseEntity::getTenantId).distinct().toList()).stream()
            .collect(Collectors.toMap(TenantEntity::getId, Function.identity()));
        List<UserEntity> companyUsers = activeCompanyUsers(companyId);
        int created = 0;
        for (LeaseEntity lease : leases) {
            TenantEntity tenant = tenants.get(lease.getTenantId());
            String title = "Lease expiry reminder";
            String message = "Lease %s expires on %s.".formatted(lease.getLeaseNumber(), lease.getLeaseEndDate());
            created += notifyCompanyUsers(companyId, companyUsers, "LEASE_EXPIRY_REMINDER", title, message, "LEASE", lease.getId(), "HIGH", List.of("IN_APP", "EMAIL"));
            if (tenant != null && tenant.getEmail() != null) {
                createNotification(companyId, new NotificationCreateRequest(null, tenantDisplayName(tenant), tenant.getEmail(), tenant.getPhoneNumber(), "LEASE_EXPIRY_REMINDER", title, message, "LEASE", lease.getId(), "HIGH", List.of("EMAIL", "SMS")));
                created++;
            }
        }
        return new ReminderRunResponse("LEASE_EXPIRY_REMINDER", created);
    }

    @Transactional
    public void sendWorkflowNotification(Long companyId, String type, String title, String message, String entityType, Long entityId, String priority) {
        notifyCompanyUsers(companyId, activeCompanyUsers(companyId), type, title, message, entityType, entityId, priority, List.of("IN_APP"));
    }

    private int notifyCompanyUsers(Long companyId, List<UserEntity> users, String type, String title, String message, String entityType, Long entityId, String priority, List<String> channels) {
        int created = 0;
        for (UserEntity user : users) {
            createNotification(companyId, new NotificationCreateRequest(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), type, title, message, entityType, entityId, priority, channels));
            created++;
        }
        return created;
    }

    private NotificationEntity createNotification(Long companyId, NotificationCreateRequest request) {
        String type = normalizeChoice(request.notificationType(), NOTIFICATION_TYPES, "Notification type");
        String priority = normalizeChoice(request.priority() == null ? "NORMAL" : request.priority(), PRIORITIES, "Priority");
        List<String> channels = normalizeChannels(request.channels());

        NotificationEntity notification = new NotificationEntity();
        notification.setCompanyId(companyId);
        notification.setRecipientUserId(request.recipientUserId());
        notification.setRecipientName(normalizeText(request.recipientName()));
        notification.setRecipientEmail(normalizeText(request.recipientEmail()));
        notification.setRecipientPhone(normalizeText(request.recipientPhone()));
        notification.setNotificationType(type);
        notification.setTitle(normalizeRequiredText(request.title(), "Title"));
        notification.setMessage(normalizeRequiredText(request.message(), "Message"));
        notification.setEntityType(normalizeText(request.entityType()));
        notification.setEntityId(request.entityId());
        notification.setPriority(priority);
        NotificationEntity saved = notificationRepository.save(notification);

        for (String channel : channels) {
            deliveryRepository.save(deliver(saved, channel));
        }
        return saved;
    }

    private NotificationDeliveryEntity deliver(NotificationEntity notification, String channel) {
        NotificationDeliveryEntity delivery = new NotificationDeliveryEntity();
        delivery.setNotificationId(notification.getId());
        delivery.setChannel(channel);
        delivery.setAttemptedAt(Instant.now());

        if ("IN_APP".equals(channel)) {
            delivery.setDestination(notification.getRecipientUserId() == null ? "broadcast-record" : String.valueOf(notification.getRecipientUserId()));
            delivery.setStatus("DELIVERED");
            delivery.setProviderMessage("Stored as in-app notification");
            return delivery;
        }
        if ("EMAIL".equals(channel)) {
            delivery.setDestination(notification.getRecipientEmail());
            if (notification.getRecipientEmail() == null) {
                delivery.setStatus("SKIPPED");
                delivery.setProviderMessage("Recipient email is not available");
                return delivery;
            }
            EmailSenderService.DeliveryResult result = emailSenderService.sendNotification(notification.getRecipientEmail(), notification.getTitle(), notification.getMessage());
            delivery.setStatus(result.delivered() ? "DELIVERED" : "FAILED");
            delivery.setProviderMessage(result.message());
            return delivery;
        }
        if ("SMS".equals(channel) || "WHATSAPP".equals(channel)) {
            delivery.setDestination(notification.getRecipientPhone());
            if (notification.getRecipientPhone() == null) {
                delivery.setStatus("SKIPPED");
                delivery.setProviderMessage("Recipient phone is not available");
                return delivery;
            }
            log.info("{} provider is not configured. Notification {} for {} was logged.", channel, notification.getId(), notification.getRecipientPhone());
            delivery.setStatus("PENDING_PROVIDER");
            delivery.setProviderMessage(channel + " provider is not configured; delivery was logged for audit.");
            return delivery;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Notification channel is invalid");
    }

    private List<NotificationDto> toDtos(List<NotificationEntity> notifications) {
        if (notifications.isEmpty()) {
            return List.of();
        }
        Map<Long, List<NotificationDeliveryEntity>> deliveriesByNotificationId = deliveryRepository.findAllByNotificationIdInOrderByIdAsc(
            notifications.stream().map(NotificationEntity::getId).toList()
        ).stream().collect(Collectors.groupingBy(NotificationDeliveryEntity::getNotificationId, LinkedHashMap::new, Collectors.toList()));

        return notifications.stream()
            .map(notification -> new NotificationDto(
                notification.getId(),
                notification.getCompanyId(),
                notification.getRecipientUserId(),
                notification.getRecipientName(),
                notification.getRecipientEmail(),
                notification.getRecipientPhone(),
                notification.getNotificationType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getEntityType(),
                notification.getEntityId(),
                notification.getPriority(),
                notification.getReadAt(),
                notification.getReadAt() != null,
                deliveriesByNotificationId.getOrDefault(notification.getId(), List.of()).stream()
                    .map(delivery -> new NotificationDeliveryDto(delivery.getId(), delivery.getChannel(), delivery.getDestination(), delivery.getStatus(), delivery.getProviderMessage(), delivery.getAttemptedAt()))
                    .toList()
            ))
            .toList();
    }

    private List<UserEntity> activeCompanyUsers(Long companyId) {
        List<Long> userIds = userCompanyRepository.findAllByCompanyIdAndStatusIgnoreCase(companyId, "ACTIVE").stream()
            .map(UserCompanyEntity::getUserId)
            .distinct()
            .toList();
        if (userIds.isEmpty()) {
            return List.of();
        }
        return userRepository.findAllById(userIds).stream().filter(UserEntity::isActive).toList();
    }

    private NotificationEntity requireNotification(Long id, Long companyId) {
        return notificationRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
    }

    private List<String> normalizeChannels(List<String> values) {
        if (values == null || values.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one notification channel is required");
        }
        List<String> normalized = new ArrayList<>();
        for (String value : values) {
            String channel = normalizeChoice(value, CHANNELS, "Notification channel");
            if (!normalized.contains(channel)) {
                normalized.add(channel);
            }
        }
        return normalized;
    }

    private String tenantDisplayName(TenantEntity tenant) {
        if (tenant.getCompanyName() != null && !tenant.getCompanyName().isBlank()) {
            return tenant.getCompanyName();
        }
        return List.of(tenant.getFirstName(), tenant.getLastName()).stream()
            .filter(Objects::nonNull)
            .filter(value -> !value.isBlank())
            .collect(Collectors.joining(" "));
    }

    private String normalizeChoice(String value, List<String> allowedValues, String label) {
        String normalized = normalizeRequiredText(value, label).toUpperCase();
        if (!allowedValues.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is invalid");
        }
        return normalized;
    }

    private String normalizeRequiredText(String value, String label) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        return normalized;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
