package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Registro/actualización del token FCM del dispositivo para notificaciones push. */
public record RegisterDeviceTokenRequest(

        @NotBlank(message = "El token del dispositivo es obligatorio")
        String pushToken
) {
}
