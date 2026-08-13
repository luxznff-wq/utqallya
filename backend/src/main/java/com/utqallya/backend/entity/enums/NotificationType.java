package com.utqallya.backend.entity.enums;

/**
 * Tipos de notificación push/persistida que puede recibir un usuario.
 */
public enum NotificationType {
    TRIP_REQUEST,
    TRIP_OFFER_RECEIVED,
    TRIP_OFFER_SELECTED,
    TRIP_ACCEPTED,
    DRIVER_ARRIVED,
    TRIP_STARTED,
    TRIP_FINISHED,
    TRIP_CANCELLED,
    PAYMENT_CONFIRMED,
    DRIVER_APPROVED,
    DRIVER_REJECTED,
    DOCUMENT_EXPIRING,
    DOCUMENT_EXPIRED,
    INCIDENT_UPDATED,
    ACCOUNT_BLOCKED
}
