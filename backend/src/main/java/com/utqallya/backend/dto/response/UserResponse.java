package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.RoleName;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String email,
        String phone,
        RoleName role,
        boolean blocked
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName(),
                user.isBlocked()
        );
    }
}
