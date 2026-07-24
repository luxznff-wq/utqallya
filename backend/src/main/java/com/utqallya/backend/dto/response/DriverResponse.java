package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;

import java.util.UUID;

public record DriverResponse(
        UUID id,
        UserResponse user,
        VehicleResponse vehicle,
        DriverApprovalStatus approvalStatus,
        DriverAvailability availability,
        Double ratingAverage,
        Integer totalTrips,
        String rejectionReason
) {
    public static DriverResponse from(Driver driver) {
        return new DriverResponse(
                driver.getId(),
                UserResponse.from(driver.getUser()),
                VehicleResponse.from(driver.getVehicle()),
                driver.getApprovalStatus(),
                driver.getAvailability(),
                driver.getRatingAverage(),
                driver.getTotalTrips(),
                driver.getRejectionReason()
        );
    }
}
