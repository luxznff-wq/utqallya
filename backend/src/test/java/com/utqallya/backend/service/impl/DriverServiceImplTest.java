package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.UpdateAvailabilityRequest;
import com.utqallya.backend.dto.request.UpdateDriverDocumentsRequest;
import com.utqallya.backend.dto.request.UpdateDriverPaymentDetailsRequest;
import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.Role;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;
import com.utqallya.backend.entity.enums.RoleName;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.repository.DriverLocationRepository;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
class DriverServiceImplTest {

    @Mock DriverRepository driverRepository;
    @Mock DriverLocationRepository driverLocationRepository;
    @Mock FileStorageService fileStorageService;

    @Test
    void refusesAvailabilityWhenSoatIsExpired() {
        User user = User.builder().role(new Role(RoleName.DRIVER)).build();
        Driver driver = Driver.builder()
                .user(user)
                .approvalStatus(DriverApprovalStatus.APPROVED)
                .availability(DriverAvailability.UNAVAILABLE)
                .licenseExpiresAt(LocalDate.now().plusMonths(6))
                .soatExpiresAt(LocalDate.now().minusDays(1))
                .build();
        when(driverRepository.findByUser(user)).thenReturn(Optional.of(driver));
        DriverServiceImpl service = new DriverServiceImpl(driverRepository, driverLocationRepository, fileStorageService);

        assertThatThrownBy(() -> service.updateAvailability(user, new UpdateAvailabilityRequest(true)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("SOAT");

        assertThat(driver.getAvailability()).isEqualTo(DriverAvailability.UNAVAILABLE);
        verify(driverRepository).save(driver);
    }

    @Test
    void documentRenewalReturnsDriverToPendingReview() {
        User user = User.builder().role(new Role(RoleName.DRIVER)).build();
        Driver driver = Driver.builder()
                .user(user)
                .approvalStatus(DriverApprovalStatus.APPROVED)
                .availability(DriverAvailability.AVAILABLE)
                .licensePhotoUrl("old-license")
                .soatPhotoUrl("old-soat")
                .build();
        MultipartFile licensePhoto = mock(MultipartFile.class);
        MultipartFile soatPhoto = mock(MultipartFile.class);
        when(driverRepository.findByUser(user)).thenReturn(Optional.of(driver));
        when(fileStorageService.upload(licensePhoto, "drivers/license")).thenReturn("new-license");
        when(fileStorageService.upload(soatPhoto, "drivers/soat")).thenReturn("new-soat");
        when(driverRepository.save(driver)).thenReturn(driver);
        DriverServiceImpl service = new DriverServiceImpl(driverRepository, driverLocationRepository, fileStorageService);
        LocalDate licenseExpiry = LocalDate.now().plusYears(2);
        LocalDate soatExpiry = LocalDate.now().plusYears(1);

        service.updateDocuments(user, new UpdateDriverDocumentsRequest(licenseExpiry, soatExpiry),
                licensePhoto, soatPhoto);

        assertThat(driver.getApprovalStatus()).isEqualTo(DriverApprovalStatus.PENDING);
        assertThat(driver.getAvailability()).isEqualTo(DriverAvailability.UNAVAILABLE);
        assertThat(driver.getLicensePhotoUrl()).isEqualTo("new-license");
        assertThat(driver.getSoatPhotoUrl()).isEqualTo("new-soat");
        verify(fileStorageService).delete("old-license");
        verify(fileStorageService).delete("old-soat");
    }

    @Test
    void savesDriverYapeDetails() {
        User user = User.builder().role(new Role(RoleName.DRIVER)).build();
        Driver driver = Driver.builder().user(user).build();
        when(driverRepository.findByUser(user)).thenReturn(Optional.of(driver));
        when(driverRepository.save(driver)).thenReturn(driver);
        DriverServiceImpl service = new DriverServiceImpl(driverRepository, driverLocationRepository, fileStorageService);

        service.updatePaymentDetails(user,
                new UpdateDriverPaymentDetailsRequest("  María Quispe  ", "987654321"));

        assertThat(driver.getYapeHolderName()).isEqualTo("María Quispe");
        assertThat(driver.getYapePhone()).isEqualTo("987654321");
    }
}
