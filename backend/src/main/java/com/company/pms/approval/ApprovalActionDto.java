package com.company.pms.approval;

import java.time.Instant;

public record ApprovalActionDto(Long id, Integer levelNo, String action, Long approverUserId, String approverName, Long approverRoleId, String approverRoleName, String remarks, Instant actionAt) {}
