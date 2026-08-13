package com.utqallya.backend.service;

import com.utqallya.backend.dto.response.AdminAuditLogResponse;
import com.utqallya.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminAuditService {

    void record(User actor, String action, String targetType, UUID targetId, String details);

    Page<AdminAuditLogResponse> getLogs(Pageable pageable);
}
