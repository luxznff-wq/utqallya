package com.utqallya.backend.controller;

import com.utqallya.backend.dto.response.DirectionsResponse;
import com.utqallya.backend.service.DirectionsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Ruta entre dos puntos (distancia, duración y polilínea para dibujar en el
 * mapa). Usado tanto para la vista previa antes de pedir un viaje como para
 * el seguimiento en vivo — ver {@code DirectionsServiceImpl} para el
 * comportamiento de respaldo cuando Directions API no está disponible.
 */
@RestController
@RequestMapping("/api/directions")
@RequiredArgsConstructor
public class DirectionsController {

    private final DirectionsService directionsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PASSENGER','DRIVER')")
    public ResponseEntity<DirectionsResponse> getRoute(
            @RequestParam double originLat,
            @RequestParam double originLng,
            @RequestParam double destLat,
            @RequestParam double destLng
    ) {
        return ResponseEntity.ok(directionsService.getRoute(originLat, originLng, destLat, destLng));
    }
}
