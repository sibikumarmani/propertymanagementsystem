package com.company.pms.approval;

import com.company.pms.auth.UserEntity;
import com.company.pms.auth.UserRepository;
import com.company.pms.role.RoleEntity;
import com.company.pms.role.RoleRepository;
import com.company.pms.security.SecurityContextService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ApprovalService {
    private static final List<String> TYPES = List.of("LEASE_APPROVAL", "LEASE_TERMINATION", "RENT_DISCOUNT", "INVOICE_CANCELLATION", "HIGH_VALUE_MAINTENANCE", "PURCHASE_ORDER", "VENDOR_BILL", "SECURITY_DEPOSIT_REFUND");
    private static final List<String> STATUSES = List.of("PENDING", "APPROVED", "REJECTED", "RESUBMITTED", "CANCELLED");
    private static final List<String> ACTIONS = List.of("SUBMITTED", "APPROVED", "REJECTED", "RESUBMITTED");

    private final ApprovalWorkflowConfigRepository configRepository;
    private final ApprovalRequestRepository requestRepository;
    private final ApprovalActionRepository actionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final SecurityContextService securityContextService;

    public ApprovalService(ApprovalWorkflowConfigRepository configRepository, ApprovalRequestRepository requestRepository, ApprovalActionRepository actionRepository, RoleRepository roleRepository, UserRepository userRepository, SecurityContextService securityContextService) {
        this.configRepository = configRepository;
        this.requestRepository = requestRepository;
        this.actionRepository = actionRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public ApprovalOptionsDto getOptions() {
        return new ApprovalOptionsDto(TYPES, STATUSES, ACTIONS);
    }

    @Transactional(readOnly = true)
    public List<ApprovalWorkflowConfigDto> getConfigs() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return toConfigDtos(configRepository.findAllByCompanyIdOrderByTransactionTypeAscLevelNoAscIdAsc(companyId));
    }

    @Transactional
    public ApprovalWorkflowConfigDto createConfig(ApprovalConfigUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        ApprovalWorkflowConfigEntity saved = configRepository.save(apply(new ApprovalWorkflowConfigEntity(), request, companyId));
        return toConfigDtos(List.of(saved)).get(0);
    }

    @Transactional
    public ApprovalWorkflowConfigDto updateConfig(Long id, ApprovalConfigUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        ApprovalWorkflowConfigEntity config = configRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Approval config"));
        return toConfigDtos(List.of(configRepository.save(apply(config, request, companyId)))).get(0);
    }

    @Transactional
    public void deleteConfig(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        configRepository.delete(configRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Approval config")));
    }

    @Transactional(readOnly = true)
    public List<ApprovalRequestDto> getRequests() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return toRequestDtos(requestRepository.findAllByCompanyIdOrderBySubmittedAtDescIdDesc(companyId));
    }

    @Transactional
    public ApprovalRequestDto submit(ApprovalSubmitRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String type = choice(request.transactionType(), TYPES, "Transaction type");
        Optional<ApprovalRequestEntity> existing = requestRepository.findByCompanyIdAndTransactionTypeAndEntityId(companyId, type, request.entityId());
        if (existing.isPresent() && !List.of("REJECTED", "CANCELLED").contains(existing.get().getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Approval request is already active for this transaction");
        }
        List<ApprovalWorkflowConfigEntity> levels = matchingLevels(companyId, type, request.amount());
        if (levels.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active approval workflow is configured for this transaction");
        }
        ApprovalRequestEntity entity = existing.orElseGet(ApprovalRequestEntity::new);
        entity.setCompanyId(companyId);
        entity.setTransactionType(type);
        entity.setEntityId(request.entityId());
        entity.setReferenceNumber(required(request.referenceNumber(), "Reference number"));
        entity.setAmount(request.amount());
        entity.setStatus(existing.isPresent() ? "RESUBMITTED" : "PENDING");
        entity.setCurrentLevel(levels.get(0).getLevelNo());
        entity.setRequestedBy(securityContextService.getCurrentAuthenticatedUser().userId());
        entity.setSubmittedAt(Instant.now());
        entity.setCompletedAt(null);
        entity.setRequesterRemarks(text(request.remarks()));
        entity.setFinalRemarks(null);
        ApprovalRequestEntity saved = requestRepository.save(entity);
        record(saved, existing.isPresent() ? "RESUBMITTED" : "SUBMITTED", null, request.remarks());
        return toRequestDtos(List.of(saved)).get(0);
    }

    @Transactional
    public ApprovalRequestDto approve(Long id, ApprovalDecisionRequest decision) {
        Long companyId = securityContextService.getCurrentCompanyId();
        ApprovalRequestEntity request = requireRequest(id, companyId);
        if (!List.of("PENDING", "RESUBMITTED").contains(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending approvals can be approved");
        }
        ApprovalWorkflowConfigEntity current = currentLevelConfig(request);
        ensureCurrentUserCanApprove(current);
        record(request, "APPROVED", current.getApproverRoleId(), decision == null ? null : decision.remarks());
        List<ApprovalWorkflowConfigEntity> levels = matchingLevels(companyId, request.getTransactionType(), request.getAmount());
        Optional<ApprovalWorkflowConfigEntity> next = levels.stream().filter(level -> level.getLevelNo() > request.getCurrentLevel()).findFirst();
        if (next.isPresent()) {
            request.setCurrentLevel(next.get().getLevelNo());
        } else {
            request.setStatus("APPROVED");
            request.setCompletedAt(Instant.now());
            request.setFinalRemarks(decision == null ? null : text(decision.remarks()));
        }
        return toRequestDtos(List.of(requestRepository.save(request))).get(0);
    }

    @Transactional
    public ApprovalRequestDto reject(Long id, ApprovalDecisionRequest decision) {
        Long companyId = securityContextService.getCurrentCompanyId();
        ApprovalRequestEntity request = requireRequest(id, companyId);
        if (!List.of("PENDING", "RESUBMITTED").contains(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending approvals can be rejected");
        }
        ApprovalWorkflowConfigEntity current = currentLevelConfig(request);
        ensureCurrentUserCanApprove(current);
        String remarks = decision == null ? null : decision.remarks();
        request.setStatus("REJECTED");
        request.setCompletedAt(Instant.now());
        request.setFinalRemarks(text(remarks));
        record(request, "REJECTED", current.getApproverRoleId(), remarks);
        return toRequestDtos(List.of(requestRepository.save(request))).get(0);
    }

    @Transactional
    public ApprovalRequestDto resubmit(Long id, ApprovalDecisionRequest decision) {
        ApprovalRequestEntity request = requireRequest(id, securityContextService.getCurrentCompanyId());
        return submit(new ApprovalSubmitRequest(request.getTransactionType(), request.getEntityId(), request.getReferenceNumber(), request.getAmount(), decision == null ? request.getRequesterRemarks() : decision.remarks()));
    }

    private ApprovalWorkflowConfigEntity apply(ApprovalWorkflowConfigEntity entity, ApprovalConfigUpsertRequest request, Long companyId) {
        entity.setCompanyId(companyId);
        entity.setTransactionType(choice(request.transactionType(), TYPES, "Transaction type"));
        entity.setLevelNo(request.levelNo());
        RoleEntity role = roleRepository.findById(request.approverRoleId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approver role not found"));
        if (!role.isActive()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approver role must be active");
        if (request.minAmount() != null && request.maxAmount() != null && request.minAmount().compareTo(request.maxAmount()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum amount cannot exceed maximum amount");
        }
        entity.setApproverRoleId(role.getId());
        entity.setMinAmount(request.minAmount());
        entity.setMaxAmount(request.maxAmount());
        entity.setActive(request.active() == null || request.active());
        return entity;
    }

    private List<ApprovalWorkflowConfigEntity> matchingLevels(Long companyId, String type, BigDecimal amount) {
        return configRepository.findAllByCompanyIdAndTransactionTypeAndActiveTrueOrderByLevelNoAscIdAsc(companyId, type).stream()
            .filter(config -> amount == null || ((config.getMinAmount() == null || amount.compareTo(config.getMinAmount()) >= 0) && (config.getMaxAmount() == null || amount.compareTo(config.getMaxAmount()) <= 0)))
            .toList();
    }

    private ApprovalWorkflowConfigEntity currentLevelConfig(ApprovalRequestEntity request) {
        return matchingLevels(request.getCompanyId(), request.getTransactionType(), request.getAmount()).stream()
            .filter(config -> config.getLevelNo().equals(request.getCurrentLevel()))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current approval level is not configured"));
    }

    private void ensureCurrentUserCanApprove(ApprovalWorkflowConfigEntity config) {
        Long userId = securityContextService.getCurrentAuthenticatedUser().userId();
        boolean hasRole = securityContextService.isAdmin() || userRepository.findById(userId).isPresent() && roleRepository.findById(config.getApproverRoleId()).isPresent()
            && securityContextService.getCurrentAuthenticatedUser().roles().stream().anyMatch(role -> role.equalsIgnoreCase(roleRepository.findById(config.getApproverRoleId()).get().getRoleName()));
        if (!hasRole) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Current user does not have the approver role for this level");
    }

    private void record(ApprovalRequestEntity request, String action, Long roleId, String remarks) {
        ApprovalActionEntity entity = new ApprovalActionEntity();
        entity.setApprovalRequestId(request.getId());
        entity.setLevelNo(request.getCurrentLevel());
        entity.setAction(action);
        entity.setApproverUserId(securityContextService.getCurrentAuthenticatedUser().userId());
        entity.setApproverRoleId(roleId);
        entity.setRemarks(text(remarks));
        entity.setActionAt(Instant.now());
        actionRepository.save(entity);
    }

    private List<ApprovalWorkflowConfigDto> toConfigDtos(List<ApprovalWorkflowConfigEntity> configs) {
        Map<Long, RoleEntity> roles = roleRepository.findAllById(configs.stream().map(ApprovalWorkflowConfigEntity::getApproverRoleId).distinct().toList()).stream().collect(Collectors.toMap(RoleEntity::getId, Function.identity()));
        return configs.stream().map(c -> new ApprovalWorkflowConfigDto(c.getId(), c.getCompanyId(), c.getTransactionType(), c.getLevelNo(), c.getApproverRoleId(), roles.get(c.getApproverRoleId()) == null ? null : roles.get(c.getApproverRoleId()).getRoleName(), c.getMinAmount(), c.getMaxAmount(), c.getActive())).toList();
    }

    private List<ApprovalRequestDto> toRequestDtos(List<ApprovalRequestEntity> requests) {
        if (requests.isEmpty()) return List.of();
        Map<Long, UserEntity> users = userRepository.findAllById(requests.stream().map(ApprovalRequestEntity::getRequestedBy).filter(Objects::nonNull).distinct().toList()).stream().collect(Collectors.toMap(UserEntity::getId, Function.identity()));
        List<ApprovalActionEntity> actions = actionRepository.findAllByApprovalRequestIdInOrderByActionAtAscIdAsc(requests.stream().map(ApprovalRequestEntity::getId).toList());
        Map<Long, UserEntity> actionUsers = userRepository.findAllById(actions.stream().map(ApprovalActionEntity::getApproverUserId).filter(Objects::nonNull).distinct().toList()).stream().collect(Collectors.toMap(UserEntity::getId, Function.identity()));
        Map<Long, RoleEntity> roles = roleRepository.findAllById(actions.stream().map(ApprovalActionEntity::getApproverRoleId).filter(Objects::nonNull).distinct().toList()).stream().collect(Collectors.toMap(RoleEntity::getId, Function.identity()));
        Map<Long, List<ApprovalActionEntity>> byRequest = actions.stream().collect(Collectors.groupingBy(ApprovalActionEntity::getApprovalRequestId));
        return requests.stream().map(r -> new ApprovalRequestDto(r.getId(), r.getCompanyId(), r.getTransactionType(), r.getEntityId(), r.getReferenceNumber(), r.getAmount(), r.getStatus(), r.getCurrentLevel(), r.getRequestedBy(), users.get(r.getRequestedBy()) == null ? null : users.get(r.getRequestedBy()).getFullName(), r.getSubmittedAt(), r.getCompletedAt(), r.getRequesterRemarks(), r.getFinalRemarks(), byRequest.getOrDefault(r.getId(), List.of()).stream().map(a -> new ApprovalActionDto(a.getId(), a.getLevelNo(), a.getAction(), a.getApproverUserId(), actionUsers.get(a.getApproverUserId()) == null ? null : actionUsers.get(a.getApproverUserId()).getFullName(), a.getApproverRoleId(), roles.get(a.getApproverRoleId()) == null ? null : roles.get(a.getApproverRoleId()).getRoleName(), a.getRemarks(), a.getActionAt())).toList())).toList();
    }

    private ApprovalRequestEntity requireRequest(Long id, Long companyId) { return requestRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> notFound("Approval request")); }
    private ResponseStatusException notFound(String label) { return new ResponseStatusException(HttpStatus.NOT_FOUND, label + " not found"); }
    private String choice(String value, List<String> allowed, String label) { String normalized = required(value, label).toUpperCase(); if (!allowed.contains(normalized)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is invalid"); return normalized; }
    private String required(String value, String label) { String text = text(value); if (text == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required"); return text; }
    private String text(String value) { return value == null || value.trim().isEmpty() ? null : value.trim(); }
}
