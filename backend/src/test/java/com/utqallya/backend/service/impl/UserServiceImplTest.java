package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.ChangePasswordRequest;
import com.utqallya.backend.dto.request.UpdateEmergencyContactRequest;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.Role;
import com.utqallya.backend.entity.Trip;
import com.utqallya.backend.entity.enums.RoleName;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.repository.UserRepository;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.TripRepository;
import com.utqallya.backend.repository.VehicleRepository;
import com.utqallya.backend.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock private DriverRepository driverRepository;
    @Mock private TripRepository tripRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private FileStorageService fileStorageService;

    private UserServiceImpl service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new UserServiceImpl(
                userRepository, passwordEncoder, driverRepository,
                tripRepository, vehicleRepository, fileStorageService);
        user = User.builder().passwordHash("old-hash").build();
    }

    @Test
    void changesPasswordWhenCurrentPasswordMatches() {
        when(passwordEncoder.matches("old-password", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        service.changePassword(user, new ChangePasswordRequest("old-password", "new-password"));

        verify(userRepository).save(user);
        verify(passwordEncoder).encode("new-password");
    }

    @Test
    void rejectsIncorrectCurrentPassword() {
        when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword(user, new ChangePasswordRequest("wrong", "new-password")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("La contraseña actual es incorrecta");
        verify(userRepository, never()).save(user);
    }

    @Test
    void rejectsReusingTheSamePassword() {
        when(passwordEncoder.matches("same-password", "old-hash")).thenReturn(true);

        assertThatThrownBy(() -> service.changePassword(user, new ChangePasswordRequest("same-password", "same-password")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("La nueva contraseña debe ser diferente");
        verify(userRepository, never()).save(user);
    }

    @Test
    void savesNormalizedEmergencyContact() {
        user.setRole(new Role(RoleName.PASSENGER));
        when(userRepository.save(user)).thenReturn(user);

        service.updateEmergencyContact(user,
                new UpdateEmergencyContactRequest("  Mamá  ", "+51987654321"));

        assertThat(user.getEmergencyContactName()).isEqualTo("Mamá");
        assertThat(user.getEmergencyContactPhone()).isEqualTo("+51987654321");
        verify(userRepository).save(user);
    }

    @Test
    void anonymizesPassengerWithoutActiveTrips() {
        user.setId(UUID.randomUUID());
        user.setRole(new Role(RoleName.PASSENGER));
        user.setEmail("person@example.com");
        user.setPhone("999999999");
        when(tripRepository.findByPassengerAndStatusIn(any(), any())).thenReturn(List.of());
        when(passwordEncoder.encode(any())).thenReturn("deleted-hash");

        service.deleteAccount(user);

        assertThat(user.isBlocked()).isTrue();
        assertThat(user.getDeletedAt()).isNotNull();
        assertThat(user.getEmail()).endsWith("@utqallya.invalid");
        assertThat(user.getPhone()).startsWith("del");
        assertThat(user.getPushToken()).isNull();
        verify(userRepository).save(user);
    }

    @Test
    void refusesDeletionDuringActivePassengerTrip() {
        user.setRole(new Role(RoleName.PASSENGER));
        when(tripRepository.findByPassengerAndStatusIn(any(), any())).thenReturn(List.of(new Trip()));

        assertThatThrownBy(() -> service.deleteAccount(user))
                .isInstanceOf(ConflictException.class)
                .hasMessage("No puedes eliminar tu cuenta mientras tienes un viaje activo");
    }
}
