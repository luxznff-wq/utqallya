package com.utqallya.backend.util;

/**
 * Utilidades geográficas puras (sin estado). Se usa la fórmula de Haversine
 * porque, a la escala de dos distritos vecinos, es suficientemente precisa
 * y evita depender de una extensión geoespacial en la base de datos (KISS).
 */
public final class GeoUtils {

    private static final double EARTH_RADIUS_METERS = 6_371_000;

    private GeoUtils() {
    }

    /** Distancia en línea recta entre dos coordenadas, en metros. */
    public static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_METERS * c;
    }

    /** Distancia en kilómetros, redondeada a 2 decimales. */
    public static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double km = distanceMeters(lat1, lon1, lat2, lon2) / 1000.0;
        return Math.round(km * 100.0) / 100.0;
    }
}
