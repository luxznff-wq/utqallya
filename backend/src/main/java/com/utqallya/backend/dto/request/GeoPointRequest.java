package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.NotNull;

/** Punto geográfico simple, reutilizado como origen/destino al crear un viaje. */
public record GeoPointRequest(

        @NotNull Double latitude,
        @NotNull Double longitude,
        String address
) {
}
