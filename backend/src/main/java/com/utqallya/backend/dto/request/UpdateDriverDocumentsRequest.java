package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record UpdateDriverDocumentsRequest(
        @NotNull(message = "La fecha de vencimiento de la licencia es obligatoria")
        @Future(message = "La licencia debe estar vigente")
        LocalDate licenseExpiresAt,

        @NotNull(message = "La fecha de vencimiento del SOAT es obligatoria")
        @Future(message = "El SOAT debe estar vigente")
        LocalDate soatExpiresAt
) {
}
