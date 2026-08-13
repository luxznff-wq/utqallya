package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.RejectDriverRequest;
import com.utqallya.backend.dto.response.AdminStatsResponse;
import com.utqallya.backend.dto.response.AdminDriverResponse;
import com.utqallya.backend.dto.response.TripResponse;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Operaciones exclusivas del panel administrativo: aprobar/rechazar conductores,
 * bloquear usuarios y consultar estadísticas básicas. Deliberadamente simple,
 * sin funciones de tipo ERP.
 */
public interface AdminService {

    Page<AdminDriverResponse> getDrivers(DriverApprovalStatus status, Pageable pageable);

    AdminDriverResponse approveDriver(UUID driverId);

    AdminDriverResponse rejectDriver(UUID driverId, RejectDriverRequest request);

    void blockUser(UUID userId);

    void unblockUser(UUID userId);

    Page<TripResponse> getAllTrips(Pageable pageable);

    AdminStatsResponse getStats();
}
