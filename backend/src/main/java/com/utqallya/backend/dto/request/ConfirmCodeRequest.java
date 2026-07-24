package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Código numérico que el conductor ingresa, dictado por el pasajero al momento de la recogida. */
public record ConfirmCodeRequest(

        @NotBlank(message = "El código es obligatorio")
        @Pattern(regexp = "^\\d{4,6}$", message = "El código debe ser numérico de 4 a 6 dígitos")
        String code
) {
}
