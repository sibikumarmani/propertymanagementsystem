package com.company.pms.audit;

import java.time.Instant;

public record AuditLogDto(Long id, Long companyId, Long userId, String userName, String action, String screen, String entityType, Long entityId, String oldValue, String newValue, String ipAddress, Instant actionAt) {}
