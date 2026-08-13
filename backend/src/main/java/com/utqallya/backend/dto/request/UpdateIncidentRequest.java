package com.utqallya.backend.dto.request;

import com.utqallya.backend.entity.enums.IncidentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateIncidentRequest(
        @NotNull(message = "El estado es obligatorio") IncidentStatus status,
        @Size(max = 1000, message = "La nota no puede superar 1000 caracteres") String adminNote
) {
}
