package com.utqallya.backend.dto.response;

/** Estadísticas básicas para el panel administrativo (nada de reportes tipo ERP). */
public record AdminStatsResponse(
        long totalPassengers,
        long totalDrivers,
        long driversPendingApproval,
        long driversApproved,
        long tripsToday,
        long tripsInProgress,
        long tripsCompletedTotal,
        double averageDriverRating
) {
}
