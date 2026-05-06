package com.company.pms.approval;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApprovalActionRepository extends JpaRepository<ApprovalActionEntity, Long> {
    List<ApprovalActionEntity> findAllByApprovalRequestIdInOrderByActionAtAscIdAsc(List<Long> requestIds);
    List<ApprovalActionEntity> findAllByApprovalRequestIdOrderByActionAtAscIdAsc(Long requestId);
}
