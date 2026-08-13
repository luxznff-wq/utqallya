package com.utqallya.backend.service.impl;

import com.utqallya.backend.config.AppProperties;
import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.GeoLocation;
import com.utqallya.backend.entity.PaymentMethod;
import com.utqallya.backend.entity.Role;
import com.utqallya.backend.entity.Trip;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.Vehicle;
import com.utqallya.backend.dto.request.CancelTripRequest;
import com.utqallya.backend.dto.request.ConfirmCodeRequest;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;
import com.utqallya.backend.entity.enums.CancelledBy;
import com.utqallya.backend.entity.enums.PaymentMethodCode;
import com.utqallya.backend.entity.enums.NotificationType;
import com.utqallya.backend.entity.enums.RoleName;
import com.utqallya.backend.entity.enums.TripStatus;
import com.utqallya.backend.entity.enums.VehicleType;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.repository.DriverLocationRepository;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.GeoLocationRepository;
import com.utqallya.backend.repository.PaymentMethodRepository;
import com.utqallya.backend.repository.TripRepository;
import com.utqallya.backend.repository.TripOfferRepository;
import com.utqallya.backend.service.DirectionsService;
import com.utqallya.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class TripServiceImplTest {

    @Mock TripRepository tripRepository;
    @Mock TripOfferRepository tripOfferRepository;
    @Mock GeoLocationRepository geoLocationRepository;
    @Mock PaymentMethodRepository paymentMethodRepository;
    @Mock DriverRepository driverRepository;
    @Mock DriverLocationRepository driverLocationRepository;
    @Mock NotificationService notificationService;
    @Mock DirectionsService directionsService;

    private TripServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TripServiceImpl(
                tripRepository, tripOfferRepository, geoLocationRepository, paymentMethodRepository,
                driverRepository, driverLocationRepository, notificationService,
                directionsService, new AppProperties());
    }

    @Test
    void advancesFromArrivalThroughConfirmationToFinishedAndReleasesDriver() {
        JourneyFixture fixture = journey(TripStatus.DRIVER_ARRIVING);
        when(driverRepository.findByUser(fixture.driverUser())).thenReturn(Optional.of(fixture.driver()));
        when(tripRepository.findById(fixture.trip().getId())).thenReturn(Optional.of(fixture.trip()));

        service.markDriverArrived(fixture.driverUser(), fixture.trip().getId());
        assertThat(fixture.trip().getStatus()).isEqualTo(TripStatus.WAITING_CONFIRMATION);
        assertThat(fixture.trip().getDriverArrivedAt()).isNotNull();

        service.confirmCode(fixture.driverUser(), fixture.trip().getId(), new ConfirmCodeRequest("1234"));
        assertThat(fixture.trip().getStatus()).isEqualTo(TripStatus.IN_PROGRESS);
        assertThat(fixture.trip().getStartedAt()).isNotNull();

        service.finishTrip(fixture.driverUser(), fixture.trip().getId());
        assertThat(fixture.trip().getStatus()).isEqualTo(TripStatus.FINISHED);
        assertThat(fixture.trip().getFinishedAt()).isNotNull();
        assertThat(fixture.driver().getAvailability()).isEqualTo(DriverAvailability.AVAILABLE);
        assertThat(fixture.driver().getTotalTrips()).isEqualTo(1);
    }

    @Test
    void wrongConfirmationCodeIsCountedWithoutStartingTrip() {
        JourneyFixture fixture = journey(TripStatus.WAITING_CONFIRMATION);
        when(driverRepository.findByUser(fixture.driverUser())).thenReturn(Optional.of(fixture.driver()));
        when(tripRepository.findById(fixture.trip().getId())).thenReturn(Optional.of(fixture.trip()));

        assertThatThrownBy(() -> service.confirmCode(
                fixture.driverUser(), fixture.trip().getId(), new ConfirmCodeRequest("9999")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ingresado es incorrecto");

        assertThat(fixture.trip().getConfirmationAttempts()).isEqualTo(1);
        assertThat(fixture.trip().getStatus()).isEqualTo(TripStatus.WAITING_CONFIRMATION);
        verify(tripRepository).save(fixture.trip());
    }

    @Test
    void confirmationCodeIsBlockedAfterFiveFailedAttempts() {
        JourneyFixture fixture = journey(TripStatus.WAITING_CONFIRMATION);
        fixture.trip().setConfirmationAttempts(5);
        when(driverRepository.findByUser(fixture.driverUser())).thenReturn(Optional.of(fixture.driver()));
        when(tripRepository.findById(fixture.trip().getId())).thenReturn(Optional.of(fixture.trip()));

        assertThatThrownBy(() -> service.confirmCode(
                fixture.driverUser(), fixture.trip().getId(), new ConfirmCodeRequest("1234")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("límite");

        assertThat(fixture.trip().getStatus()).isEqualTo(TripStatus.WAITING_CONFIRMATION);
        verify(tripRepository, never()).save(any());
    }

    @Test
    void cannotCancelTripAlreadyInProgress() {
        JourneyFixture fixture = journey(TripStatus.IN_PROGRESS);
        when(tripRepository.findById(fixture.trip().getId())).thenReturn(Optional.of(fixture.trip()));

        assertThatThrownBy(() -> service.cancelTrip(
                fixture.passenger(), fixture.trip().getId(), new CancelTripRequest("Cambio de planes")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Este viaje ya no puede cancelarse en su estado actual");

        verify(tripRepository, never()).save(any());
    }

    @Test
    void passengerCancellationReleasesAssignedDriver() {
        JourneyFixture fixture = journey(TripStatus.DRIVER_ARRIVING);
        when(tripRepository.findById(fixture.trip().getId())).thenReturn(Optional.of(fixture.trip()));

        service.cancelTrip(fixture.passenger(), fixture.trip().getId(), new CancelTripRequest("Cambio de planes"));

        assertThat(fixture.trip().getStatus()).isEqualTo(TripStatus.CANCELLED);
        assertThat(fixture.driver().getAvailability()).isEqualTo(DriverAvailability.AVAILABLE);
        assertThat(fixture.trip().getCancelledAt()).isNotNull();
        assertThat(fixture.trip().getCancelReason()).isEqualTo("Cambio de planes");
        assertThat(fixture.trip().getCancelledBy()).isEqualTo(CancelledBy.PASSENGER);
        verify(driverRepository).save(fixture.driver());
    }

    @Test
    void cashTripDoesNotExposeDriverYapeDetails() {
        JourneyFixture fixture = journey(TripStatus.DRIVER_ARRIVING);
        fixture.driver().setYapeHolderName("Titular privado");
        fixture.driver().setYapePhone("999999999");

        var response = com.utqallya.backend.dto.response.TripResponse.forPassenger(fixture.trip());

        assertThat(response.driver().yapeHolderName()).isNull();
        assertThat(response.driver().yapePhone()).isNull();
    }

    @Test
    void passengerConfirmsPaymentAfterFinishedTrip() {
        JourneyFixture fixture = journey(TripStatus.FINISHED);
        when(tripRepository.findById(fixture.trip().getId())).thenReturn(Optional.of(fixture.trip()));

        var response = service.confirmPayment(fixture.passenger(), fixture.trip().getId());

        assertThat(response.passengerPaymentConfirmedAt()).isNotNull();
        assertThat(response.driverPaymentConfirmedAt()).isNull();
        verify(notificationService).notify(fixture.driverUser(), NotificationType.PAYMENT_CONFIRMED,
                "Confirmación de pago", "El pasajero confirmó el pago del viaje.", fixture.trip().getId());
    }

    private JourneyFixture journey(TripStatus status) {
        User passenger = User.builder().fullName("Pasajero").email("p@example.com").phone("999999999")
                .role(new Role(RoleName.PASSENGER)).build();
        passenger.setId(UUID.randomUUID());
        User driverUser = User.builder().fullName("Conductor").email("d@example.com").phone("988888888")
                .role(new Role(RoleName.DRIVER)).build();
        driverUser.setId(UUID.randomUUID());
        Vehicle vehicle = Vehicle.builder().type(VehicleType.CAR).plate("ABC123")
                .photoUrl("https://example.com/car.jpg").build();
        Driver driver = Driver.builder().user(driverUser).vehicle(vehicle)
                .dniNumber("12345678").dniPhotoUrl("dni").licensePhotoUrl("license").soatPhotoUrl("soat")
                .approvalStatus(DriverApprovalStatus.APPROVED).availability(DriverAvailability.UNAVAILABLE)
                .ratingAverage(0.0).totalRatings(0).totalTrips(0).build();
        driver.setId(UUID.randomUUID());
        Trip trip = Trip.builder().passenger(passenger).driver(driver)
                .origin(GeoLocation.builder().latitude(-15.44).longitude(-74.61).address("Origen").build())
                .destination(GeoLocation.builder().latitude(-15.45).longitude(-74.62).address("Destino").build())
                .paymentMethod(new PaymentMethod(PaymentMethodCode.CASH, "Efectivo"))
                .vehicleType(VehicleType.CAR).status(status).confirmationCode("1234")
                .confirmationAttempts(0).distanceKm(2.0).estimatedDurationMinutes(8).searchRadiusMeters(4000)
                .build();
        trip.setId(UUID.randomUUID());
        return new JourneyFixture(passenger, driverUser, driver, trip);
    }

    private record JourneyFixture(User passenger, User driverUser, Driver driver, Trip trip) {
    }
}
