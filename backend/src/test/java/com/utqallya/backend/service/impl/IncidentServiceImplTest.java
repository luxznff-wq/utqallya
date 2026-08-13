package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.CreateIncidentRequest;
import com.utqallya.backend.entity.Incident;
import com.utqallya.backend.entity.Role;
import com.utqallya.backend.entity.Trip;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.IncidentCategory;
import com.utqallya.backend.entity.enums.RoleName;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.IncidentRepository;
import com.utqallya.backend.repository.TripRepository;
import com.utqallya.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncidentServiceImplTest {

    @Mock IncidentRepository incidentRepository;
    @Mock TripRepository tripRepository;
    @Mock NotificationService notificationService;
    private IncidentServiceImpl service;
    private User passenger;
    private Trip trip;

    @BeforeEach
    void setUp() {
        service = new IncidentServiceImpl(incidentRepository, tripRepository, notificationService);
        passenger = User.builder().fullName("Pasajero").email("passenger@example.com")
                .phone("999999999").role(new Role(RoleName.PASSENGER)).build();
        passenger.setId(UUID.randomUUID());
        trip = Trip.builder().passenger(passenger).build();
        trip.setId(UUID.randomUUID());
    }

    @Test
    void participantCanReportIncidentForOwnTrip() {
        when(tripRepository.findById(trip.getId())).thenReturn(Optional.of(trip));
        when(incidentRepository.findByTripIdAndReporter(trip.getId(), passenger)).thenReturn(Optional.empty());
        when(incidentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(passenger, new CreateIncidentRequest(
                trip.getId(), IncidentCategory.SAFETY, "Situación de riesgo durante el viaje"));

        assertThat(response.tripId()).isEqualTo(trip.getId());
        assertThat(response.category()).isEqualTo(IncidentCategory.SAFETY);
        verify(incidentRepository).save(any(Incident.class));
    }

    @Test
    void unrelatedUserCannotReportIncidentForAnotherTrip() {
        User stranger = User.builder().build();
        stranger.setId(UUID.randomUUID());
        when(tripRepository.findById(trip.getId())).thenReturn(Optional.of(trip));

        assertThatThrownBy(() -> service.create(stranger, new CreateIncidentRequest(
                trip.getId(), IncidentCategory.OTHER, "No participé en este viaje")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Viaje no encontrado");

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void sameReporterCannotDuplicateIncidentForTrip() {
        when(tripRepository.findById(trip.getId())).thenReturn(Optional.of(trip));
        when(incidentRepository.findByTripIdAndReporter(trip.getId(), passenger))
                .thenReturn(Optional.of(new Incident()));

        assertThatThrownBy(() -> service.create(passenger, new CreateIncidentRequest(
                trip.getId(), IncidentCategory.ACCIDENT, "Descripción suficiente")))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Ya reportaste un incidente para este viaje");
    }
}
