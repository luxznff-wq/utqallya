package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.RejectDriverRequest;
import com.utqallya.backend.dto.response.AdminStatsResponse;
import com.utqallya.backend.dto.response.DriverResponse;
import com.utqallya.backend.dto.response.TripResponse;
import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.NotificationType;
import com.utqallya.backend.entity.enums.RoleName;
import com.utqallya.backend.entity.enums.TripStatus;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.TripRepository;
import com.utqallya.backend.repository.UserRepository;
import com.utqallya.backend.service.AdminService;
import com.utqallya.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<DriverResponse> getDrivers(DriverApprovalStatus status, Pageable pageable) {
        Page<Driver> drivers = status != null
                ? driverRepository.findByApprovalStatus(status, pageable)
                : driverRepository.findAll(pageable);
        return drivers.map(DriverResponse::from);
    }

    @Override
    @Transactional
    public DriverResponse approveDriver(UUID driverId) {
        Driver driver = getDriverOrThrow(driverId);
        driver.setApprovalStatus(DriverApprovalStatus.APPROVED);
        driver.setRejectionReason(null);
        driverRepository.save(driver);

        notificationService.notify(driver.getUser(), NotificationType.DRIVER_APPROVED,
                "¡Ya puedes conducir en Utqallya!", "Tu documentación fue aprobada. Actívate para recibir viajes.", null);

        return DriverResponse.from(driver);
    }

    @Override
    @Transactional
    public DriverResponse rejectDriver(UUID driverId, RejectDriverRequest request) {
        Driver driver = getDriverOrThrow(driverId);
        driver.setApprovalStatus(DriverApprovalStatus.REJECTED);
        driver.setRejectionReason(request.reason());
        driver.setAvailability(com.utqallya.backend.entity.enums.DriverAvailability.UNAVAILABLE);
        driverRepository.save(driver);

        notificationService.notify(driver.getUser(), NotificationType.DRIVER_REJECTED,
                "Tu solicitud fue rechazada", "Motivo: " + request.reason(), null);

        return DriverResponse.from(driver);
    }

    @Override
    @Transactional
    public void blockUser(UUID userId) {
        User user = getUserOrThrow(userId);
        user.setBlocked(true);
        userRepository.save(user);

        notificationService.notify(user, NotificationType.ACCOUNT_BLOCKED,
                "Cuenta bloqueada", "Tu cuenta ha sido bloqueada por el administrador", null);
    }

    @Override
    @Transactional
    public void unblockUser(UUID userId) {
        User user = getUserOrThrow(userId);
        user.setBlocked(false);
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TripResponse> getAllTrips(Pageable pageable) {
        return tripRepository.findAll(pageable).map(TripResponse::forAdmin);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        Instant startOfToday = LocalDate.now(ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant();

        long completed = tripRepository.countByStatusIn(List.of(TripStatus.FINISHED, TripStatus.RATED));

        return new AdminStatsResponse(
                userRepository.countByRoleName(RoleName.PASSENGER),
                driverRepository.count(),
                driverRepository.countByApprovalStatus(DriverApprovalStatus.PENDING),
                driverRepository.countByApprovalStatus(DriverApprovalStatus.APPROVED),
                tripRepository.countByCreatedAtAfter(startOfToday),
                tripRepository.countByStatus(TripStatus.IN_PROGRESS),
                completed,
                Math.round(driverRepository.averageRatingAcrossDrivers() * 100.0) / 100.0
        );
    }

    private Driver getDriverOrThrow(UUID driverId) {
        return driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Conductor no encontrado"));
    }

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }
}
