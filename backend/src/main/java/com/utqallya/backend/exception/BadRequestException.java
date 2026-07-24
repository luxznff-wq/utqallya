package com.utqallya.backend.exception;

/** Se lanza cuando la solicitud es inválida según reglas de negocio (no de validación de campos). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
