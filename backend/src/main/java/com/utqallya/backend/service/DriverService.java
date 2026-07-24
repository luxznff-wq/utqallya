package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.UpdateAvailabilityRequest;
import com.utqallya.backend.dto.request.UpdateDriverLocationRequest;
import com.utqallya.backend.dto.response.DriverResponse;
import com.utqallya.backend.entity.User;

public interface DriverService {

    DriverResponse getMyProfile(User user);

    DriverResponse updateAvailability(User user, UpdateAvailabilityRequest request);

    void updateLocation(User user, UpdateDriverLocationRequest request);
}
