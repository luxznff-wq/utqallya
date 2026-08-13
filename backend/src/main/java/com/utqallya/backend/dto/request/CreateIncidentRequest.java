package com.utqallya.backend.dto.request;

import com.utqallya.backend.entity.enums.IncidentCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateIncidentRequest(
        @NotNull(message = "El viaje es obligatorio") UUID tripId,
        @NotNull(message = "La categoría es obligatoria") IncidentCategory category,
        @NotBlank(message = "Describe lo sucedido")
        @Size(min = 10, max = 1000, message = "La descripción debe tener entre 10 y 1000 caracteres")
        String description
) {
}
