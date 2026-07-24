package com.utqallya.backend.util;

import java.security.SecureRandom;

/**
 * Genera el código numérico aleatorio (4 a 6 dígitos, configurable) que el
 * pasajero dicta al conductor para confirmar el inicio del viaje.
 */
public final class TripCodeGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    private TripCodeGenerator() {
    }

    public static String generate(int length) {
        if (length < 4 || length > 6) {
            throw new IllegalArgumentException("El código de confirmación debe tener entre 4 y 6 dígitos");
        }
        StringBuilder code = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            code.append(RANDOM.nextInt(10));
        }
        return code.toString();
    }
}
