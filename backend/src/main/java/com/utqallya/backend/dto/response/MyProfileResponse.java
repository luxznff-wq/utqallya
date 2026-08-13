package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.RoleName;

import java.util.UUID;

/** Perfil privado: nunca debe incluirse dentro de viajes ni incidentes ajenos. */
public record MyProfileResponse(
        UUID id,
        String fullName,
        String email,
        String phone,
        RoleName role,
        boolean blocked,
        String emergencyContactName,
        String emergencyContactPhone
) {
    public static MyProfileResponse from(User user) {
        return new MyProfileResponse(
                user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getRole().getName(), user.isBlocked(),
                user.getEmergencyContactName(), user.getEmergencyContactPhone());
    }
}
