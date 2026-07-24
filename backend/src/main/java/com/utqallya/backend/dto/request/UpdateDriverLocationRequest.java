package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.NotNull;

/** Actualización periódica de posición enviada por la app del conductor. */
public record UpdateDriverLocationRequest(

        @NotNull Double latitude,
        @NotNull Double longitude,
        Double heading
) {
}
