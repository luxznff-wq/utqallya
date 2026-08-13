package com.utqallya.backend.dto.response;

import java.util.List;

/**
 * Ruta entre dos puntos. Cuando Google Directions API no está configurada o
 * falla, {@code polyline} cae a una línea recta de 2 puntos y las métricas
 * se calculan con Haversine — el cliente nunca necesita saber cuál fue.
 */
public record DirectionsResponse(
        Double distanceKm,
        Integer durationMinutes,
        List<RoutePointResponse> polyline
) {
}
