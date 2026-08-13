package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.CreateTripOfferRequest;
import com.utqallya.backend.entity.*;
import com.utqallya.backend.entity.enums.*;
import com.utqallya.backend.repository.*;
import com.utqallya.backend.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TripOfferServiceImplTest {
    @Mock TripRepository tripRepository;
    @Mock TripOfferRepository offerRepository;
    @Mock DriverRepository driverRepository;
    @Mock DriverLocationRepository driverLocationRepository;
    @Mock NotificationService notificationService;

    @Test
    void availableNearbyDriverCreatesPriceOffer() {
        User passenger = User.builder().fullName("Pasajero").role(new Role(RoleName.PASSENGER)).build();
        passenger.setId(UUID.randomUUID());
        User driverUser = User.builder().fullName("Conductor").role(new Role(RoleName.DRIVER)).build();
        Driver driver = Driver.builder()
                .user(driverUser)
                .vehicle(Vehicle.builder().type(VehicleType.CAR).plate("ABC123").photoUrl("photo").build())
                .approvalStatus(DriverApprovalStatus.APPROVED)
                .availability(DriverAvailability.AVAILABLE)
                .ratingAverage(4.8)
                .totalTrips(10)
                .build();
        driver.setId(UUID.randomUUID());
        GeoLocation origin = GeoLocation.builder().latitude(-15.44).longitude(-74.61).build();
        Trip trip = Trip.builder()
                .passenger(passenger)
                .origin(origin)
                .destination(GeoLocation.builder().latitude(-15.45).longitude(-74.62).build())
                .paymentMethod(new PaymentMethod(PaymentMethodCode.CASH, "Efectivo"))
                .vehicleType(VehicleType.CAR)
                .status(TripStatus.SEARCHING_DRIVER)
                .searchRadiusMeters(4000)
                .build();
        trip.setId(UUID.randomUUID());
        DriverLocation location = DriverLocation.builder()
                .driver(driver).latitude(-15.441).longitude(-74.611).heading(0.0).build();
        when(driverRepository.findByUser(driverUser)).thenReturn(Optional.of(driver));
        when(tripRepository.findById(trip.getId())).thenReturn(Optional.of(trip));
        when(driverLocationRepository.findByDriver(driver)).thenReturn(Optional.of(location));
        when(offerRepository.findByTripIdAndDriver(trip.getId(), driver)).thenReturn(Optional.empty());
        when(offerRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        TripOfferServiceImpl service = new TripOfferServiceImpl(
                tripRepository, offerRepository, driverRepository, driverLocationRepository, notificationService);

        var response = service.createOrUpdate(driverUser, trip.getId(),
                new CreateTripOfferRequest(new BigDecimal("12.50")));

        assertThat(response.amount()).isEqualByComparingTo("12.50");
        verify(notificationService).notify(passenger, NotificationType.TRIP_OFFER_RECEIVED,
                "Nueva oferta de viaje", "Conductor ofreció llevarte por S/ 12.50", trip.getId());
    }

    @Test
    void passengerSelectionAssignsDriverAndPersistsAgreedFare() {
        User passenger = User.builder().fullName("Pasajero").email("p@example.com").phone("999999999")
                .role(new Role(RoleName.PASSENGER)).build();
        passenger.setId(UUID.randomUUID());
        User driverUser = User.builder().fullName("Conductor").email("d@example.com").phone("988888888")
                .role(new Role(RoleName.DRIVER)).build();
        Driver driver = Driver.builder()
                .user(driverUser)
                .vehicle(Vehicle.builder().type(VehicleType.CAR).plate("ABC123").photoUrl("photo").build())
                .approvalStatus(DriverApprovalStatus.APPROVED)
                .availability(DriverAvailability.AVAILABLE)
                .ratingAverage(4.8).totalTrips(10).build();
        driver.setId(UUID.randomUUID());
        Trip trip = Trip.builder()
                .passenger(passenger)
                .origin(GeoLocation.builder().latitude(-15.44).longitude(-74.61).address("Origen").build())
                .destination(GeoLocation.builder().latitude(-15.45).longitude(-74.62).address("Destino").build())
                .paymentMethod(new PaymentMethod(PaymentMethodCode.CASH, "Efectivo"))
                .vehicleType(VehicleType.CAR)
                .status(TripStatus.SEARCHING_DRIVER)
                .confirmationCode("1234").distanceKm(2.0).estimatedDurationMinutes(8).searchRadiusMeters(4000)
                .build();
        trip.setId(UUID.randomUUID());
        TripOffer offer = TripOffer.builder().trip(trip).driver(driver)
                .amount(new BigDecimal("14.00")).build();
        offer.setId(UUID.randomUUID());
        when(tripRepository.findByIdAndPassengerForUpdate(trip.getId(), passenger)).thenReturn(Optional.of(trip));
        when(offerRepository.findById(offer.getId())).thenReturn(Optional.of(offer));
        when(driverRepository.findByIdForUpdate(driver.getId())).thenReturn(Optional.of(driver));
        when(tripRepository.findByDriverIdAndStatusIn(any(), any())).thenReturn(List.of());
        when(offerRepository.findByTripIdAndStatusOrderByAmountAscCreatedAtAsc(
                trip.getId(), TripOfferStatus.PENDING)).thenReturn(List.of(offer));
        TripOfferServiceImpl service = new TripOfferServiceImpl(
                tripRepository, offerRepository, driverRepository, driverLocationRepository, notificationService);

        var response = service.select(passenger, trip.getId(), offer.getId());

        assertThat(response.status()).isEqualTo(TripStatus.DRIVER_ARRIVING);
        assertThat(response.agreedFare()).isEqualByComparingTo("14.00");
        assertThat(driver.getAvailability()).isEqualTo(DriverAvailability.UNAVAILABLE);
        assertThat(offer.getStatus()).isEqualTo(TripOfferStatus.SELECTED);
    }
}
