package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.UpdateAvailabilityRequest;
import com.utqallya.backend.dto.request.UpdateDriverLocationRequest;
import com.utqallya.backend.dto.response.DriverResponse;
import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.DriverLocation;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.DriverLocationRepository;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverRepository driverRepository;
    private final DriverLocationRepository driverLocationRepository;

    @Override
    @Transactional(readOnly = true)
    public DriverResponse getMyProfile(User user) {
        return DriverResponse.from(findDriverByUser(user));
    }

    @Override
    @Transactional
    public DriverResponse updateAvailability(User user, UpdateAvailabilityRequest request) {
        Driver driver = findDriverByUser(user);

        if (Boolean.TRUE.equals(request.available()) && driver.getApprovalStatus() != DriverApprovalStatus.APPROVED) {
            throw new BadRequestException("Tu documentación aún no ha sido aprobada por el administrador");
        }

        driver.setAvailability(request.available() ? DriverAvailability.AVAILABLE : DriverAvailability.UNAVAILABLE);
        driverRepository.save(driver);
        return DriverResponse.from(driver);
    }

    @Override
    @Transactional
    public void updateLocation(User user, UpdateDriverLocationRequest request) {
        Driver driver = findDriverByUser(user);

        DriverLocation location = driverLocationRepository.findByDriver(driver)
                .orElseGet(() -> DriverLocation.builder().driver(driver).build());

        location.setLatitude(request.latitude());
        location.setLongitude(request.longitude());
        location.setHeading(request.heading() != null ? request.heading() : 0.0);
        driverLocationRepository.save(location);
    }

    private Driver findDriverByUser(User user) {
        return driverRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de conductor no encontrado"));
    }
}
