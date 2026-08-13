package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateEmergencyContactRequest(
        @NotBlank(message = "El nombre del contacto es obligatorio")
        @Size(max = 120)
        String name,

        @NotBlank(message = "El teléfono del contacto es obligatorio")
        @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Ingresa un teléfono válido con código de país")
        String phone
) {
}
