package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.enums.IncidentCategory;
import com.utqallya.backend.entity.enums.IncidentStatus;

import java.time.Instant;
import java.util.UUID;

public record IncidentResponse(
        UUID id,
        UUID tripId,
        UserResponse reporter,
        IncidentCategory category,
        String description,
        IncidentStatus status,
        String adminNote,
        Instant createdAt,
        Instant resolvedAt
) {
}
