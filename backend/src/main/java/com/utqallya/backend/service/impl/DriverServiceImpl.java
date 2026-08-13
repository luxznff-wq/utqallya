package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.UpdateAvailabilityRequest;
import com.utqallya.backend.dto.request.UpdateDriverLocationRequest;
import com.utqallya.backend.dto.request.UpdateDriverDocumentsRequest;
import com.utqallya.backend.dto.request.UpdateDriverPaymentDetailsRequest;
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
import com.utqallya.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverServiceImpl implements DriverService {

    private final DriverRepository driverRepository;
    private final DriverLocationRepository driverLocationRepository;
    private final FileStorageService fileStorageService;

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
        if (Boolean.TRUE.equals(request.available()) && documentsAreExpired(driver)) {
            driver.setAvailability(DriverAvailability.UNAVAILABLE);
            driverRepository.save(driver);
            throw new BadRequestException("Tu licencia o SOAT está vencido o no tiene una fecha válida");
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

    @Override
    @Transactional
    public DriverResponse updateDocuments(User user, UpdateDriverDocumentsRequest request,
                                          MultipartFile licensePhoto, MultipartFile soatPhoto) {
        Driver driver = findDriverByUser(user);
        String previousLicenseUrl = driver.getLicensePhotoUrl();
        String previousSoatUrl = driver.getSoatPhotoUrl();
        String newLicenseUrl = fileStorageService.upload(licensePhoto, "drivers/license");
        String newSoatUrl;
        try {
            newSoatUrl = fileStorageService.upload(soatPhoto, "drivers/soat");
        } catch (RuntimeException exception) {
            deletePreviousDocument(newLicenseUrl);
            throw exception;
        }

        driver.setLicensePhotoUrl(newLicenseUrl);
        driver.setSoatPhotoUrl(newSoatUrl);
        driver.setLicenseExpiresAt(request.licenseExpiresAt());
        driver.setSoatExpiresAt(request.soatExpiresAt());
        driver.setApprovalStatus(DriverApprovalStatus.PENDING);
        driver.setAvailability(DriverAvailability.UNAVAILABLE);
        driver.setRejectionReason(null);
        Driver saved = driverRepository.save(driver);

        deletePreviousDocument(previousLicenseUrl);
        deletePreviousDocument(previousSoatUrl);
        return DriverResponse.from(saved);
    }

    @Override
    @Transactional
    public DriverResponse updatePaymentDetails(User user, UpdateDriverPaymentDetailsRequest request) {
        Driver driver = findDriverByUser(user);
        driver.setYapeHolderName(request.yapeHolderName().trim());
        driver.setYapePhone(request.yapePhone().trim());
        return DriverResponse.from(driverRepository.save(driver));
    }

    private Driver findDriverByUser(User user) {
        return driverRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de conductor no encontrado"));
    }

    private boolean documentsAreExpired(Driver driver) {
        LocalDate today = LocalDate.now();
        return driver.getLicenseExpiresAt() == null || driver.getLicenseExpiresAt().isBefore(today)
                || driver.getSoatExpiresAt() == null || driver.getSoatExpiresAt().isBefore(today);
    }

    private void deletePreviousDocument(String url) {
        try {
            fileStorageService.delete(url);
        } catch (RuntimeException exception) {
            log.warn("Documento anterior no pudo eliminarse; requiere limpieza posterior");
        }
    }
}
