package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.ChangePasswordRequest;
import com.utqallya.backend.dto.request.UpdateEmergencyContactRequest;
import com.utqallya.backend.dto.response.MyProfileResponse;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.RoleName;
import com.utqallya.backend.entity.enums.TripStatus;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.TripRepository;
import com.utqallya.backend.repository.UserRepository;
import com.utqallya.backend.repository.VehicleRepository;
import com.utqallya.backend.service.FileStorageService;
import com.utqallya.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final FileStorageService fileStorageService;

    private static final List<TripStatus> ACTIVE_STATUSES = List.of(
            TripStatus.REQUESTED, TripStatus.SEARCHING_DRIVER, TripStatus.ACCEPTED,
            TripStatus.DRIVER_ARRIVING, TripStatus.WAITING_CONFIRMATION, TripStatus.IN_PROGRESS);

    @Override
    public MyProfileResponse getProfile(User user) {
        return MyProfileResponse.from(user);
    }

    @Override
    @Transactional
    public void registerPushToken(User user, String pushToken) {
        user.setPushToken(pushToken);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("La contraseña actual es incorrecta");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw new BadRequestException("La nueva contraseña debe ser diferente");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        incrementSessionVersion(user);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public MyProfileResponse updateEmergencyContact(User user, UpdateEmergencyContactRequest request) {
        user.setEmergencyContactName(request.name().trim());
        user.setEmergencyContactPhone(request.phone().trim());
        return MyProfileResponse.from(userRepository.save(user));
    }

    @Override
    @Transactional
    public void revokeSessions(User user) {
        incrementSessionVersion(user);
        user.setPushToken(null);
        user.setEmergencyContactName(null);
        user.setEmergencyContactPhone(null);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteAccount(User user) {
        if (user.getRole().getName() == RoleName.PASSENGER
                && !tripRepository.findByPassengerAndStatusIn(user, ACTIVE_STATUSES).isEmpty()) {
            throw new ConflictException("No puedes eliminar tu cuenta mientras tienes un viaje activo");
        }

        if (user.getRole().getName() == RoleName.DRIVER) {
            driverRepository.findByUser(user).ifPresent(driver -> {
                if (!tripRepository.findByDriverIdAndStatusIn(driver.getId(), ACTIVE_STATUSES).isEmpty()) {
                    throw new ConflictException("No puedes eliminar tu cuenta mientras tienes un viaje activo");
                }
                fileStorageService.delete(driver.getDniPhotoUrl());
                fileStorageService.delete(driver.getLicensePhotoUrl());
                fileStorageService.delete(driver.getSoatPhotoUrl());
                driver.setDniNumber("00000000");
                driver.setDniPhotoUrl("");
                driver.setLicensePhotoUrl("");
                driver.setSoatPhotoUrl("");
                driver.setAvailability(com.utqallya.backend.entity.enums.DriverAvailability.UNAVAILABLE);

                if (driver.getVehicle() != null) {
                    fileStorageService.delete(driver.getVehicle().getPhotoUrl());
                    driver.getVehicle().setPhotoUrl("");
                    driver.getVehicle().setPlate("DEL-" + driver.getId().toString().substring(0, 6).toUpperCase());
                    driver.getVehicle().setBrand(null);
                    driver.getVehicle().setModel(null);
                    driver.getVehicle().setColor(null);
                    vehicleRepository.save(driver.getVehicle());
                }
                driverRepository.save(driver);
            });
        }

        String suffix = user.getId().toString().replace("-", "");
        user.setFullName("Cuenta eliminada");
        user.setEmail("deleted+" + suffix + "@utqallya.invalid");
        user.setPhone("del" + suffix.substring(0, 16));
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setPushToken(null);
        user.setBlocked(true);
        user.setDeletedAt(Instant.now());
        incrementSessionVersion(user);
        userRepository.save(user);
    }

    private void incrementSessionVersion(User user) {
        user.setSessionVersion(user.getSessionVersion() + 1);
    }
}
