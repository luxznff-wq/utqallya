package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;

import java.util.UUID;
import java.time.LocalDate;

/**
 * Vista exclusiva del administrador. Los documentos nunca forman parte de
 * DriverResponse porque esa respuesta también llega a pasajeros.
 */
public record AdminDriverResponse(
        UUID id,
        UserResponse user,
        VehicleResponse vehicle,
        String dniNumber,
        String dniPhotoUrl,
        String licensePhotoUrl,
        LocalDate licenseExpiresAt,
        String soatPhotoUrl,
        LocalDate soatExpiresAt,
        DriverApprovalStatus approvalStatus,
        DriverAvailability availability,
        Double ratingAverage,
        Integer totalTrips,
        String rejectionReason
) {
    public static AdminDriverResponse from(Driver driver) {
        return new AdminDriverResponse(
                driver.getId(),
                UserResponse.from(driver.getUser()),
                VehicleResponse.from(driver.getVehicle()),
                driver.getDniNumber(),
                driver.getDniPhotoUrl(),
                driver.getLicensePhotoUrl(),
                driver.getLicenseExpiresAt(),
                driver.getSoatPhotoUrl(),
                driver.getSoatExpiresAt(),
                driver.getApprovalStatus(),
                driver.getAvailability(),
                driver.getRatingAverage(),
                driver.getTotalTrips(),
                driver.getRejectionReason()
        );
    }
}
