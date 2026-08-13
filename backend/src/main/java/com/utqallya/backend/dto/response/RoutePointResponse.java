package com.utqallya.backend.dto.response;

/** Un punto de la polilínea de una ruta (ver {@link DirectionsResponse}). */
public record RoutePointResponse(
        Double latitude,
        Double longitude
) {
}
