package com.utqallya.backend.controller;

import com.utqallya.backend.dto.request.UpdateAvailabilityRequest;
import com.utqallya.backend.dto.request.UpdateDriverLocationRequest;
import com.utqallya.backend.dto.response.DriverResponse;
import com.utqallya.backend.security.CurrentUserResolver;
import com.utqallya.backend.security.UserPrincipal;
import com.utqallya.backend.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints exclusivos del propio conductor: perfil, disponibilidad y posición en tiempo real. */
@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DRIVER')")
public class DriverController {

    private final DriverService driverService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping("/me")
    public ResponseEntity<DriverResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(driverService.getMyProfile(currentUserResolver.resolve(principal)));
    }

    @PatchMapping("/me/availability")
    public ResponseEntity<DriverResponse> updateAvailability(@AuthenticationPrincipal UserPrincipal principal,
                                                               @Valid @RequestBody UpdateAvailabilityRequest request) {
        return ResponseEntity.ok(driverService.updateAvailability(currentUserResolver.resolve(principal), request));
    }

    @PostMapping("/me/location")
    public ResponseEntity<Void> updateLocation(@AuthenticationPrincipal UserPrincipal principal,
                                                @Valid @RequestBody UpdateDriverLocationRequest request) {
        driverService.updateLocation(currentUserResolver.resolve(principal), request);
        return ResponseEntity.noContent().build();
    }
}
