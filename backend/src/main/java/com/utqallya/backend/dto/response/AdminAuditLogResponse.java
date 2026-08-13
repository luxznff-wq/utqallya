package com.utqallya.backend.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AdminAuditLogResponse(
        UUID id,
        UUID actorId,
        String actorEmail,
        String action,
        String targetType,
        UUID targetId,
        String details,
        String requestId,
        Instant createdAt
) {
}
