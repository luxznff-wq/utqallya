package com.utqallya.backend.entity.enums;

/**
 * Estado de revisión de la documentación de un conductor por parte del administrador.
 * Un conductor solo puede recibir viajes cuando su estado es {@link #APPROVED}.
 */
public enum DriverApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED,
    BLOCKED
}
