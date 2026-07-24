package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.DriverLocation;

public record DriverLocationResponse(
        Double latitude,
        Double longitude,
        Double heading
) {
    public static DriverLocationResponse from(DriverLocation location) {
        return new DriverLocationResponse(location.getLatitude(), location.getLongitude(), location.getHeading());
    }
}
