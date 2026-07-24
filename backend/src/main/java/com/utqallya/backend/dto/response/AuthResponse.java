package com.utqallya.backend.dto.response;

/** Respuesta de login/registro: token JWT + datos básicos del usuario autenticado. */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInMinutes,
        UserResponse user
) {
    public static AuthResponse of(String token, long expiresInMinutes, UserResponse user) {
        return new AuthResponse(token, "Bearer", expiresInMinutes, user);
    }
}
