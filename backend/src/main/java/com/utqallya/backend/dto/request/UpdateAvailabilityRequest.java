package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.NotNull;

/** Cambio manual de disponibilidad del conductor ("Disponible" / "No disponible"). */
public record UpdateAvailabilityRequest(

        @NotNull(message = "La disponibilidad es obligatoria")
        Boolean available
) {
}
