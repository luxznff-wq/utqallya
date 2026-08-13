package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateDriverPaymentDetailsRequest(
        @NotBlank(message = "El nombre del titular de Yape es obligatorio")
        @Size(max = 120)
        String yapeHolderName,

        @NotBlank(message = "El número de Yape es obligatorio")
        @Pattern(regexp = "^9\\d{8}$", message = "El número de Yape debe tener 9 dígitos y empezar con 9")
        String yapePhone
) {
}
