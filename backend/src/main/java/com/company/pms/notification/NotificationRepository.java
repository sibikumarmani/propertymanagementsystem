package com.company.pms.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findAllByCompanyIdOrderByCreatedAtDescIdDesc(Long companyId);
    List<NotificationEntity> findAllByCompanyIdAndRecipientUserIdOrderByCreatedAtDescIdDesc(Long companyId, Long recipientUserId);
    Optional<NotificationEntity> findByIdAndCompanyId(Long id, Long companyId);
}
