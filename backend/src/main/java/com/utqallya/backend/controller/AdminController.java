package com.utqallya.backend.controller;

import com.utqallya.backend.dto.request.RejectDriverRequest;
import com.utqallya.backend.dto.request.UpdateIncidentRequest;
import com.utqallya.backend.dto.response.AdminStatsResponse;
import com.utqallya.backend.dto.response.AdminDriverResponse;
import com.utqallya.backend.dto.response.TripResponse;
import com.utqallya.backend.dto.response.IncidentResponse;
import com.utqallya.backend.dto.response.AdminAuditLogResponse;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.IncidentStatus;
import com.utqallya.backend.service.AdminService;
import com.utqallya.backend.service.IncidentService;
import com.utqallya.backend.service.AdminAuditService;
import com.utqallya.backend.security.CurrentUserResolver;
import com.utqallya.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Panel administrativo: aprobar/rechazar conductores, bloquear usuarios y ver
 * estadísticas básicas. El acceso a "/api/admin/**" ya está restringido a
 * ROLE_ADMIN en {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Transactional
public class AdminController {

    private final AdminService adminService;
    private final IncidentService incidentService;
    private final AdminAuditService adminAuditService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping("/drivers")
    public ResponseEntity<Page<AdminDriverResponse>> getDrivers(
            @RequestParam(required = false) DriverApprovalStatus status, Pageable pageable) {
        return ResponseEntity.ok(adminService.getDrivers(status, pageable));
    }

    @PostMapping("/drivers/{id}/approve")
    public ResponseEntity<AdminDriverResponse> approveDriver(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        AdminDriverResponse response = adminService.approveDriver(id);
        adminAuditService.record(currentUserResolver.resolve(principal), "DRIVER_APPROVED", "DRIVER", id, null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/drivers/{id}/reject")
    public ResponseEntity<AdminDriverResponse> rejectDriver(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id, @Valid @RequestBody RejectDriverRequest request) {
        AdminDriverResponse response = adminService.rejectDriver(id, request);
        adminAuditService.record(currentUserResolver.resolve(principal), "DRIVER_REJECTED", "DRIVER", id, request.reason());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{id}/block")
    public ResponseEntity<Void> blockUser(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        adminService.blockUser(id);
        adminAuditService.record(currentUserResolver.resolve(principal), "USER_BLOCKED", "USER", id, null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/unblock")
    public ResponseEntity<Void> unblockUser(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        adminService.unblockUser(id);
        adminAuditService.record(currentUserResolver.resolve(principal), "USER_UNBLOCKED", "USER", id, null);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trips")
    public ResponseEntity<Page<TripResponse>> getAllTrips(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllTrips(pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/incidents")
    public ResponseEntity<Page<IncidentResponse>> getIncidents(
            @RequestParam(required = false) IncidentStatus status, Pageable pageable) {
        return ResponseEntity.ok(incidentService.getAll(status, pageable));
    }

    @PostMapping("/incidents/{id}")
    public ResponseEntity<IncidentResponse> updateIncident(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id, @Valid @RequestBody UpdateIncidentRequest request) {
        IncidentResponse response = incidentService.update(id, request);
        adminAuditService.record(currentUserResolver.resolve(principal), "INCIDENT_" + request.status(),
                "INCIDENT", id, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AdminAuditLogResponse>> getAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(adminAuditService.getLogs(pageable));
    }
}
