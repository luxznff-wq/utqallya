package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.Size;

/** Motivo opcional de cancelación de un viaje. */
public record CancelTripRequest(

        @Size(max = 255)
        String reason
) {
}
