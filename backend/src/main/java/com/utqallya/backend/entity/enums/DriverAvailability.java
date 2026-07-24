package com.utqallya.backend.entity.enums;

/**
 * Disponibilidad operativa del conductor, controlada por él mismo desde su perfil.
 * Solo los conductores {@code AVAILABLE} (y con estado {@code APPROVED}) reciben solicitudes de viaje.
 */
public enum DriverAvailability {
    AVAILABLE,
    UNAVAILABLE
}
