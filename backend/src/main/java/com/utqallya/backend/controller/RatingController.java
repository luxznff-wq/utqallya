package com.utqallya.backend.controller;

import com.utqallya.backend.dto.request.CreateRatingRequest;
import com.utqallya.backend.dto.response.RatingResponse;
import com.utqallya.backend.security.CurrentUserResolver;
import com.utqallya.backend.security.UserPrincipal;
import com.utqallya.backend.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** El pasajero califica al conductor al finalizar un viaje. */
@RestController
@RequestMapping("/api/trips/{tripId}/rating")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PASSENGER')")
public class RatingController {

    private final RatingService ratingService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    public ResponseEntity<RatingResponse> rateTrip(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable UUID tripId,
                                                     @Valid @RequestBody CreateRatingRequest request) {
        var response = ratingService.rateTrip(currentUserResolver.resolve(principal), tripId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
