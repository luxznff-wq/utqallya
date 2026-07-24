package com.utqallya.backend.exception;

/** Se lanza ante conflictos de estado: correo/teléfono/placa duplicados, viaje ya tomado, etc. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
