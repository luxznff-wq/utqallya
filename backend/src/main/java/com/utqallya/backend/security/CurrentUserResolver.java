package com.utqallya.backend.security;

import com.utqallya.backend.entity.User;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Resuelve la entidad {@link User} completa a partir del {@link UserPrincipal}
 * inyectado por Spring Security en cada endpoint autenticado. Evita repetir
 * esta búsqueda en cada controlador (DRY).
 */
@Component
@RequiredArgsConstructor
public class CurrentUserResolver {

    private final UserRepository userRepository;

    public User resolve(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }
}
