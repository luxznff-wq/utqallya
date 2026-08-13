package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateTripOfferRequest(
        @NotNull
        @DecimalMin(value = "1.00", message = "La oferta mínima es S/ 1.00")
        @DecimalMax(value = "9999.99", message = "La oferta excede el máximo permitido")
        @Digits(integer = 4, fraction = 2)
        BigDecimal amount
) {
}
