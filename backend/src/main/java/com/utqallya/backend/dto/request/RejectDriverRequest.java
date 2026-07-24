package com.utqallya.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Motivo que el administrador registra al rechazar la documentación de un conductor. */
public record RejectDriverRequest(

        @NotBlank(message = "El motivo de rechazo es obligatorio")
        @Size(max = 255)
        String reason
) {
}
