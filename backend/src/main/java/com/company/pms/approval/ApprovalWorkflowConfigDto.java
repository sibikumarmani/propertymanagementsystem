package com.company.pms.approval;

import java.math.BigDecimal;

public record ApprovalWorkflowConfigDto(Long id, Long companyId, String transactionType, Integer levelNo, Long approverRoleId, String approverRoleName, BigDecimal minAmount, BigDecimal maxAmount, Boolean active) {}
