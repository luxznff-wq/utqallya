package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;

import java.util.UUID;
import java.time.LocalDate;

public record DriverResponse(
        UUID id,
        UserResponse user,
        VehicleResponse vehicle,
        DriverApprovalStatus approvalStatus,
        DriverAvailability availability,
        Double ratingAverage,
        Integer totalTrips,
        String rejectionReason,
        LocalDate licenseExpiresAt,
        LocalDate soatExpiresAt,
        String yapeHolderName,
        String yapePhone
) {
    public static DriverResponse from(Driver driver) {
        return build(driver, true);
    }

    public static DriverResponse forTrip(Driver driver, boolean exposeYapeDetails) {
        return build(driver, exposeYapeDetails);
    }

    private static DriverResponse build(Driver driver, boolean exposeYapeDetails) {
        return new DriverResponse(
                driver.getId(),
                UserResponse.from(driver.getUser()),
                VehicleResponse.from(driver.getVehicle()),
                driver.getApprovalStatus(),
                driver.getAvailability(),
                driver.getRatingAverage(),
                driver.getTotalTrips(),
                driver.getRejectionReason(),
                driver.getLicenseExpiresAt(),
                driver.getSoatExpiresAt(),
                exposeYapeDetails ? driver.getYapeHolderName() : null,
                exposeYapeDetails ? driver.getYapePhone() : null
        );
    }
}
