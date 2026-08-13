package com.utqallya.backend.service.impl;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.DriverAvailability;
import com.utqallya.backend.entity.enums.NotificationType;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.NotificationRepository;
import com.utqallya.backend.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentExpiryServiceTest {
    @Mock DriverRepository driverRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock NotificationService notificationService;

    @Test
    void disablesAndNotifiesDriverWithExpiredDocument() {
        User user = User.builder().build();
        Driver driver = Driver.builder().user(user).availability(DriverAvailability.AVAILABLE)
                .licenseExpiresAt(LocalDate.now().minusDays(1))
                .soatExpiresAt(LocalDate.now().plusMonths(3)).build();
        when(driverRepository.findWithDocumentsExpiringBy(any())).thenReturn(List.of(driver));
        when(notificationRepository.existsByUserAndTypeAndCreatedAtAfter(any(), any(), any())).thenReturn(false);
        DocumentExpiryService service = new DocumentExpiryService(
                driverRepository, notificationRepository, notificationService);

        service.enforceDocumentValidity();

        assertThat(driver.getAvailability()).isEqualTo(DriverAvailability.UNAVAILABLE);
        verify(driverRepository).save(driver);
        verify(notificationService).notify(user, NotificationType.DOCUMENT_EXPIRED,
                "Documentos vencidos", "Renueva tu licencia o SOAT para volver a recibir viajes.", null);
    }
}
