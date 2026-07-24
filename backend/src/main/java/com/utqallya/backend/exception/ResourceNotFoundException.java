package com.utqallya.backend.exception;

/** Se lanza cuando una entidad solicitada (usuario, viaje, conductor, etc.) no existe. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
