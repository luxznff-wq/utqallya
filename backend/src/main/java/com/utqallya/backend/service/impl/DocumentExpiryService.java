package com.utqallya.backend.service.impl;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.enums.DriverAvailability;
import com.utqallya.backend.entity.enums.NotificationType;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.NotificationRepository;
import com.utqallya.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class DocumentExpiryService {
    private final DriverRepository driverRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 15 3 * * *", zone = "America/Lima")
    @Transactional
    public void enforceDocumentValidity() {
        LocalDate today = LocalDate.now();
        LocalDate warningLimit = today.plusDays(30);
        Instant deduplicationThreshold = Instant.now().minus(7, ChronoUnit.DAYS);

        for (Driver driver : driverRepository.findWithDocumentsExpiringBy(warningLimit)) {
            boolean expired = isExpired(driver, today);
            NotificationType type = expired ? NotificationType.DOCUMENT_EXPIRED : NotificationType.DOCUMENT_EXPIRING;
            if (expired && driver.getAvailability() != DriverAvailability.UNAVAILABLE) {
                driver.setAvailability(DriverAvailability.UNAVAILABLE);
                driverRepository.save(driver);
            }
            if (!notificationRepository.existsByUserAndTypeAndCreatedAtAfter(
                    driver.getUser(), type, deduplicationThreshold)) {
                notificationService.notify(driver.getUser(), type,
                        expired ? "Documentos vencidos" : "Tus documentos vencerán pronto",
                        expired
                                ? "Renueva tu licencia o SOAT para volver a recibir viajes."
                                : "Revisa las fechas de tu licencia y SOAT y renuévalos con anticipación.",
                        null);
            }
        }
    }

    private boolean isExpired(Driver driver, LocalDate today) {
        return driver.getLicenseExpiresAt() == null || driver.getLicenseExpiresAt().isBefore(today)
                || driver.getSoatExpiresAt() == null || driver.getSoatExpiresAt().isBefore(today);
    }
}
