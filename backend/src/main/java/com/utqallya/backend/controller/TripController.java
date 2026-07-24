package com.utqallya.backend.controller;

import com.utqallya.backend.dto.request.CancelTripRequest;
import com.utqallya.backend.dto.request.ConfirmCodeRequest;
import com.utqallya.backend.dto.request.CreateTripRequest;
import com.utqallya.backend.dto.response.DriverLocationResponse;
import com.utqallya.backend.dto.response.TripResponse;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.security.CurrentUserResolver;
import com.utqallya.backend.security.UserPrincipal;
import com.utqallya.backend.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Ciclo de vida del viaje. No hay negociación de tarifa ni chat: cada endpoint
 * corresponde exactamente a una transición de {@code TripStatus}.
 */
@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<TripResponse> requestTrip(@AuthenticationPrincipal UserPrincipal principal,
                                                      @Valid @RequestBody CreateTripRequest request) {
        User passenger = currentUserResolver.resolve(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.requestTrip(passenger, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PASSENGER','DRIVER')")
    public ResponseEntity<TripResponse> getTrip(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        User user = currentUserResolver.resolve(principal);
        TripResponse response = isDriver(principal)
                ? tripService.getTripForDriver(user, id)
                : tripService.getTripForPassenger(user, id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/driver-location")
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<DriverLocationResponse> getDriverLocation(@AuthenticationPrincipal UserPrincipal principal,
                                                                       @PathVariable UUID id) {
        User passenger = currentUserResolver.resolve(principal);
        return ResponseEntity.ok(tripService.getDriverLocationForTrip(passenger, id));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('PASSENGER','DRIVER')")
    public ResponseEntity<Page<TripResponse>> getMyHistory(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        User user = currentUserResolver.resolve(principal);
        Page<TripResponse> history = isDriver(principal)
                ? tripService.getDriverHistory(user, pageable)
                : tripService.getPassengerHistory(user, pageable);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<TripResponse> acceptTrip(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(tripService.acceptTrip(currentUserResolver.resolve(principal), id));
    }

    @PostMapping("/{id}/arrived")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<TripResponse> markArrived(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(tripService.markDriverArrived(currentUserResolver.resolve(principal), id));
    }

    @PostMapping("/{id}/confirm-code")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<TripResponse> confirmCode(@AuthenticationPrincipal UserPrincipal principal,
                                                      @PathVariable UUID id,
                                                      @Valid @RequestBody ConfirmCodeRequest request) {
        return ResponseEntity.ok(tripService.confirmCode(currentUserResolver.resolve(principal), id, request));
    }

    @PostMapping("/{id}/finish")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<TripResponse> finishTrip(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(tripService.finishTrip(currentUserResolver.resolve(principal), id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PASSENGER','DRIVER')")
    public ResponseEntity<TripResponse> cancelTrip(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable UUID id,
                                                     @Valid @RequestBody CancelTripRequest request) {
        return ResponseEntity.ok(tripService.cancelTrip(currentUserResolver.resolve(principal), id, request));
    }

    private boolean isDriver(UserPrincipal principal) {
        return principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));
    }
}
