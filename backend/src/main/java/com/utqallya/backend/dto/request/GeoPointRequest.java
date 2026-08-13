package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Punto geográfico simple, reutilizado como origen/destino al crear un viaje. */
public record GeoPointRequest(

        @NotNull
        @DecimalMin(value = "-90.0", message = "La latitud mínima es -90")
        @DecimalMax(value = "90.0", message = "La latitud máxima es 90")
        Double latitude,

        @NotNull
        @DecimalMin(value = "-180.0", message = "La longitud mínima es -180")
        @DecimalMax(value = "180.0", message = "La longitud máxima es 180")
        Double longitude,

        @Size(max = 255, message = "La referencia no puede superar 255 caracteres")
        String address
) {
}
