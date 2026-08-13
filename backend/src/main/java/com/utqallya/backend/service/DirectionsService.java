package com.utqallya.backend.service;

import com.utqallya.backend.dto.response.DirectionsResponse;

public interface DirectionsService {

    /**
     * Ruta entre dos puntos. Nunca falla ni lanza: si Google Directions API
     * no está configurada o la llamada falla, cae a línea recta + Haversine.
     */
    DirectionsResponse getRoute(double originLat, double originLng, double destLat, double destLng);
}
