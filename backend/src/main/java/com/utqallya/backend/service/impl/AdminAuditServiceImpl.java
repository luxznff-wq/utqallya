package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.response.AdminAuditLogResponse;
import com.utqallya.backend.entity.AdminAuditLog;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.repository.AdminAuditLogRepository;
import com.utqallya.backend.service.AdminAuditService;
import com.utqallya.backend.security.RequestCorrelationFilter;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminAuditServiceImpl implements AdminAuditService {

    private final AdminAuditLogRepository repository;

    @Override
    @Transactional
    public void record(User actor, String action, String targetType, UUID targetId, String details) {
        repository.save(AdminAuditLog.builder()
                .actor(actor)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .details(details == null || details.isBlank() ? null : details.substring(0, Math.min(500, details.length())))
                .requestId(MDC.get(RequestCorrelationFilter.MDC_KEY))
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminAuditLogResponse> getLogs(Pageable pageable) {
        return repository.findAllByOrderByCreatedAtDesc(pageable).map(log -> new AdminAuditLogResponse(
                log.getId(), log.getActor().getId(), log.getActor().getEmail(), log.getAction(),
                log.getTargetType(), log.getTargetId(), log.getDetails(), log.getRequestId(), log.getCreatedAt()));
    }
}
