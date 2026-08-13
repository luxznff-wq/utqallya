package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Motivo obligatorio de cancelación para soporte, seguridad y métricas. */
public record CancelTripRequest(

        @NotBlank(message = "Selecciona o escribe un motivo de cancelación")
        @Size(min = 3, max = 255)
        String reason
) {
}
