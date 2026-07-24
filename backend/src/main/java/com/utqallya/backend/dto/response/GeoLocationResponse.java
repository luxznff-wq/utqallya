package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.GeoLocation;

public record GeoLocationResponse(
        Double latitude,
        Double longitude,
        String address
) {
    public static GeoLocationResponse from(GeoLocation location) {
        return new GeoLocationResponse(location.getLatitude(), location.getLongitude(), location.getAddress());
    }
}
