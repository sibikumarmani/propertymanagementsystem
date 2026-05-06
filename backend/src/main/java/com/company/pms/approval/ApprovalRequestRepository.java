package com.company.pms.approval;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequestEntity, Long> {
    List<ApprovalRequestEntity> findAllByCompanyIdOrderBySubmittedAtDescIdDesc(Long companyId);
    Optional<ApprovalRequestEntity> findByIdAndCompanyId(Long id, Long companyId);
    Optional<ApprovalRequestEntity> findByCompanyIdAndTransactionTypeAndEntityId(Long companyId, String transactionType, Long entityId);
}
