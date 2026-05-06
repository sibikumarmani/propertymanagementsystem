package com.company.pms.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationDeliveryRepository extends JpaRepository<NotificationDeliveryEntity, Long> {
    List<NotificationDeliveryEntity> findAllByNotificationIdInOrderByIdAsc(List<Long> notificationIds);
}
