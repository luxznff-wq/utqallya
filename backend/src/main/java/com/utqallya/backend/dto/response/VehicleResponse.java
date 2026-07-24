package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.Vehicle;
import com.utqallya.backend.entity.enums.VehicleType;

import java.util.UUID;

public record VehicleResponse(
        UUID id,
        VehicleType type,
        String plate,
        String brand,
        String model,
        String color,
        String photoUrl
) {
    public static VehicleResponse from(Vehicle vehicle) {
        if (vehicle == null) {
            return null;
        }
        return new VehicleResponse(
                vehicle.getId(), vehicle.getType(), vehicle.getPlate(),
                vehicle.getBrand(), vehicle.getModel(), vehicle.getColor(), vehicle.getPhotoUrl()
        );
    }
}
