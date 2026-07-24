package com.utqallya.backend.dto.request;

import com.utqallya.backend.entity.enums.PaymentMethodCode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/** Solicitud de viaje: origen, destino y método de pago elegido por el pasajero. */
public record CreateTripRequest(

        @Valid @NotNull(message = "El origen es obligatorio")
        GeoPointRequest origin,

        @Valid @NotNull(message = "El destino es obligatorio")
        GeoPointRequest destination,

        @NotNull(message = "El método de pago es obligatorio")
        PaymentMethodCode paymentMethod
) {
}
