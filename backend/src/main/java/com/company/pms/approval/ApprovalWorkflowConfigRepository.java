package com.company.pms.approval;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ApprovalWorkflowConfigRepository extends JpaRepository<ApprovalWorkflowConfigEntity, Long> {
    List<ApprovalWorkflowConfigEntity> findAllByCompanyIdOrderByTransactionTypeAscLevelNoAscIdAsc(Long companyId);
    List<ApprovalWorkflowConfigEntity> findAllByCompanyIdAndTransactionTypeAndActiveTrueOrderByLevelNoAscIdAsc(Long companyId, String transactionType);
    Optional<ApprovalWorkflowConfigEntity> findByIdAndCompanyId(Long id, Long companyId);
}
