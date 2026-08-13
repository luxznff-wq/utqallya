package com.utqallya.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.utqallya.backend.config.AppProperties;
import com.utqallya.backend.dto.response.DirectionsResponse;
import com.utqallya.backend.dto.response.RoutePointResponse;
import com.utqallya.backend.service.DirectionsService;
import com.utqallya.backend.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Ruta real por calles usando Google Directions API. Si no está habilitada
 * (sin API key configurada) o la llamada falla por cualquier motivo, cae a
 * una línea recta entre los dos puntos + distancia Haversine — el mismo
 * cálculo que se usaba antes de integrar esta API, para que el resto del
 * flujo (crear viaje, mostrar la ruta) nunca se rompa por esto.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DirectionsServiceImpl implements DirectionsService {

    private static final String DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";

    private final AppProperties appProperties;
    private final RestClient restClient = RestClient.create();

    @Override
    public DirectionsResponse getRoute(double originLat, double originLng, double destLat, double destLng) {
        if (appProperties.getDirections().isEnabled() && !appProperties.getDirections().getApiKey().isBlank()) {
            try {
                DirectionsResponse route = fetchFromGoogle(originLat, originLng, destLat, destLng);
                if (route != null) {
                    return route;
                }
            } catch (Exception ex) {
                log.warn("No se pudo obtener la ruta de Google Directions API, usando línea recta: {}", ex.getMessage());
            }
        }
        return straightLineFallback(originLat, originLng, destLat, destLng);
    }

    private DirectionsResponse fetchFromGoogle(double originLat, double originLng, double destLat, double destLng) {
        String url = DIRECTIONS_URL
                + "?origin=" + originLat + "," + originLng
                + "&destination=" + destLat + "," + destLng
                + "&key=" + appProperties.getDirections().getApiKey();

        JsonNode root = restClient.get().uri(url).retrieve().body(JsonNode.class);
        if (root == null || !"OK".equals(root.path("status").asText())) {
            log.warn("Google Directions API respondió con status: {}", root == null ? "null" : root.path("status").asText());
            return null;
        }

        JsonNode route = root.path("routes").path(0);
        JsonNode leg = route.path("legs").path(0);
        double distanceKm = leg.path("distance").path("value").asDouble() / 1000.0;
        int durationMinutes = (int) Math.max(1, Math.round(leg.path("duration").path("value").asDouble() / 60.0));
        String encodedPolyline = route.path("overview_polyline").path("points").asText();

        return new DirectionsResponse(
                Math.round(distanceKm * 100.0) / 100.0,
                durationMinutes,
                decodePolyline(encodedPolyline)
        );
    }

    private DirectionsResponse straightLineFallback(double originLat, double originLng, double destLat, double destLng) {
        double distanceKm = GeoUtils.distanceKm(originLat, originLng, destLat, destLng);
        int durationMinutes = GeoUtils.estimateDurationMinutes(distanceKm, appProperties.getTrip().getAverageSpeedKmh());
        List<RoutePointResponse> polyline = List.of(
                new RoutePointResponse(originLat, originLng),
                new RoutePointResponse(destLat, destLng)
        );
        return new DirectionsResponse(distanceKm, durationMinutes, polyline);
    }

    /** Decodifica el formato de polilínea codificada de Google (algoritmo estándar). */
    static List<RoutePointResponse> decodePolyline(String encoded) {
        List<RoutePointResponse> points = new ArrayList<>();
        int index = 0;
        int lat = 0;
        int lng = 0;

        while (index < encoded.length()) {
            int shift = 0;
            int result = 0;
            int b;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            lat += ((result & 1) != 0) ? ~(result >> 1) : (result >> 1);

            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            lng += ((result & 1) != 0) ? ~(result >> 1) : (result >> 1);

            points.add(new RoutePointResponse(lat / 1e5, lng / 1e5));
        }
        return points;
    }
}
