package com.utqallya.backend.entity.enums;

/**
 * Tipos de notificación push/persistida que puede recibir un usuario.
 */
public enum NotificationType {
    TRIP_REQUEST,
    TRIP_ACCEPTED,
    DRIVER_ARRIVED,
    TRIP_STARTED,
    TRIP_FINISHED,
    TRIP_CANCELLED,
    DRIVER_APPROVED,
    DRIVER_REJECTED,
    ACCOUNT_BLOCKED
}
