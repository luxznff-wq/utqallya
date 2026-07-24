package com.utqallya.backend.entity.enums;

/**
 * Ciclo de vida de un viaje en Utqallya. El flujo es estrictamente lineal,
 * sin negociación de precio ni subastas:
 * <pre>
 * REQUESTED -> SEARCHING_DRIVER -> ACCEPTED -> DRIVER_ARRIVING
 *   -> WAITING_CONFIRMATION -> IN_PROGRESS -> FINISHED -> RATED
 * </pre>
 * En cualquier punto antes de {@code IN_PROGRESS} el viaje puede pasar a {@link #CANCELLED}.
 */
public enum TripStatus {
    REQUESTED,
    SEARCHING_DRIVER,
    ACCEPTED,
    DRIVER_ARRIVING,
    WAITING_CONFIRMATION,
    IN_PROGRESS,
    FINISHED,
    RATED,
    CANCELLED
}
