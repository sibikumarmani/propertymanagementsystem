package com.company.pms.approval;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ApprovalRequestDto(Long id, Long companyId, String transactionType, Long entityId, String referenceNumber, BigDecimal amount, String status, Integer currentLevel, Long requestedBy, String requesterName, Instant submittedAt, Instant completedAt, String requesterRemarks, String finalRemarks, List<ApprovalActionDto> history) {}
