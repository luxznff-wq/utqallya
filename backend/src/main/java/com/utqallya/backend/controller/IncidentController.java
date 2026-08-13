package com.utqallya.backend.controller;

import com.utqallya.backend.dto.request.CreateIncidentRequest;
import com.utqallya.backend.dto.response.IncidentResponse;
import com.utqallya.backend.security.CurrentUserResolver;
import com.utqallya.backend.security.UserPrincipal;
import com.utqallya.backend.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    public ResponseEntity<IncidentResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateIncidentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(incidentService.create(currentUserResolver.resolve(principal), request));
    }

    @GetMapping("/me")
    public ResponseEntity<Page<IncidentResponse>> getMine(
            @AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return ResponseEntity.ok(incidentService.getMine(currentUserResolver.resolve(principal), pageable));
    }
}
