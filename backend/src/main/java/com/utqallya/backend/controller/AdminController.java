package com.utqallya.backend.controller;

import com.utqallya.backend.dto.request.RejectDriverRequest;
import com.utqallya.backend.dto.response.AdminStatsResponse;
import com.utqallya.backend.dto.response.DriverResponse;
import com.utqallya.backend.dto.response.TripResponse;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.service.AdminService;
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

import java.util.UUID;

/**
 * Panel administrativo: aprobar/rechazar conductores, bloquear usuarios y ver
 * estadísticas básicas. El acceso a "/api/admin/**" ya está restringido a
 * ROLE_ADMIN en {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/drivers")
    public ResponseEntity<Page<DriverResponse>> getDrivers(
            @RequestParam(required = false) DriverApprovalStatus status, Pageable pageable) {
        return ResponseEntity.ok(adminService.getDrivers(status, pageable));
    }

    @PostMapping("/drivers/{id}/approve")
    public ResponseEntity<DriverResponse> approveDriver(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.approveDriver(id));
    }

    @PostMapping("/drivers/{id}/reject")
    public ResponseEntity<DriverResponse> rejectDriver(@PathVariable UUID id, @Valid @RequestBody RejectDriverRequest request) {
        return ResponseEntity.ok(adminService.rejectDriver(id, request));
    }

    @PostMapping("/users/{id}/block")
    public ResponseEntity<Void> blockUser(@PathVariable UUID id) {
        adminService.blockUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/unblock")
    public ResponseEntity<Void> unblockUser(@PathVariable UUID id) {
        adminService.unblockUser(id);
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
}
