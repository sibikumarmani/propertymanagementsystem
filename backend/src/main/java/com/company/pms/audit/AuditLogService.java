package com.company.pms.audit;

import com.company.pms.auth.UserEntity;
import com.company.pms.auth.UserRepository;
import com.company.pms.security.AuthenticatedUser;
import com.company.pms.security.SecurityContextService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.List;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final SecurityContextService securityContextService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, SecurityContextService securityContextService, UserRepository userRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.securityContextService = securityContextService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogs() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return auditLogRepository.findAllByCompanyIdOrderByActionAtDescIdDesc(companyId).stream().map(this::toDto).toList();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String screen, String entityType, Long entityId, Object oldValue, Object newValue) {
        AuthenticatedUser user = securityContextService.getCurrentAuthenticatedUser();
        AuditLogEntity audit = new AuditLogEntity();
        audit.setCompanyId(user.companyId());
        audit.setUserId(user.userId());
        audit.setUserName(userRepository.findById(user.userId()).map(UserEntity::getFullName).orElse(user.email()));
        audit.setAction(action);
        audit.setScreen(screen);
        audit.setEntityType(entityType);
        audit.setEntityId(entityId);
        audit.setOldValue(toJson(oldValue));
        audit.setNewValue(toJson(newValue));
        audit.setIpAddress(ipAddress());
        audit.setActionAt(Instant.now());
        auditLogRepository.save(audit);
    }

    private AuditLogDto toDto(AuditLogEntity audit) {
        return new AuditLogDto(audit.getId(), audit.getCompanyId(), audit.getUserId(), audit.getUserName(), audit.getAction(), audit.getScreen(), audit.getEntityType(), audit.getEntityId(), audit.getOldValue(), audit.getNewValue(), audit.getIpAddress(), audit.getActionAt());
    }

    private String toJson(Object value) {
        if (value == null) return null;
        if (value instanceof String text) return text;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return String.valueOf(value);
        }
    }

    private String ipAddress() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) return null;
        HttpServletRequest request = attrs.getRequest();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
