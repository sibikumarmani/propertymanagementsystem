package com.company.pms.audit;

import com.company.pms.common.api.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("@menuAccessGuard.hasAccess('audit-logs')")
public class AuditLogController {
    private final AuditLogService auditLogService;
    public AuditLogController(AuditLogService auditLogService) { this.auditLogService = auditLogService; }
    @GetMapping public ApiResponse<List<AuditLogDto>> getAuditLogs() { return ApiResponse.ok(auditLogService.getAuditLogs()); }
}
