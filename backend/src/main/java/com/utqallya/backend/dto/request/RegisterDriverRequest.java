package com.utqallya.backend.dto.request;

import com.utqallya.backend.entity.enums.VehicleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Datos textuales requeridos para el registro de un conductor.
 * Las fotos (DNI, licencia, SOAT, vehículo) viajan como archivos multipart
 * independientes junto a este JSON (ver {@code AuthController#registerDriver}),
 * no como parte de este DTO.
 */
public record RegisterDriverRequest(

        @NotBlank @Size(min = 3, max = 120)
        String fullName,

        @NotBlank @Email
        String email,

        @NotBlank
        @Pattern(regexp = "^9\\d{8}$", message = "El teléfono debe tener 9 dígitos y empezar con 9")
        String phone,

        @NotBlank @Size(min = 8, max = 72)
        String password,

        @NotBlank(message = "El número de DNI es obligatorio")
        @Pattern(regexp = "^\\d{8}$", message = "El DNI debe tener 8 dígitos")
        String dniNumber,

        @NotNull(message = "La fecha de vencimiento de la licencia es obligatoria")
        @Future(message = "La licencia debe estar vigente")
        LocalDate licenseExpiresAt,

        @NotNull(message = "La fecha de vencimiento del SOAT es obligatoria")
        @Future(message = "El SOAT debe estar vigente")
        LocalDate soatExpiresAt,

        @NotBlank(message = "La placa del vehículo es obligatoria")
        @Size(max = 10)
        String plate,

        @NotNull(message = "El tipo de vehículo es obligatorio (CAR o MOTOTAXI)")
        VehicleType vehicleType,

        @Size(max = 60)
        String vehicleBrand,

        @Size(max = 60)
        String vehicleModel,

        @Size(max = 30)
        String vehicleColor
) {
}
