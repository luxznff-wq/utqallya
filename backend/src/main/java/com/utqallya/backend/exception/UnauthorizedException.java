package com.utqallya.backend.exception;

/** Se lanza ante credenciales inválidas o acciones no permitidas para el usuario autenticado. */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
