package com.utqallya.backend.integration;

import com.utqallya.backend.dto.request.ConfirmCodeRequest;
import com.utqallya.backend.dto.request.CreateRatingRequest;
import com.utqallya.backend.dto.request.CreateTripOfferRequest;
import com.utqallya.backend.dto.request.CreateTripRequest;
import com.utqallya.backend.dto.request.GeoPointRequest;
import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.DriverLocation;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.Vehicle;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;
import com.utqallya.backend.entity.enums.PaymentMethodCode;
import com.utqallya.backend.entity.enums.RoleName;
import com.utqallya.backend.entity.enums.TripOfferStatus;
import com.utqallya.backend.entity.enums.TripStatus;
import com.utqallya.backend.entity.enums.VehicleType;
import com.utqallya.backend.repository.DriverLocationRepository;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.NotificationRepository;
import com.utqallya.backend.repository.RoleRepository;
import com.utqallya.backend.repository.TripOfferRepository;
import com.utqallya.backend.repository.TripRepository;
import com.utqallya.backend.repository.UserRepository;
import com.utqallya.backend.repository.VehicleRepository;
import com.utqallya.backend.service.RatingService;
import com.utqallya.backend.service.TripOfferService;
import com.utqallya.backend.service.TripService;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.exception.ConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Prueba del flujo real contra PostgreSQL y las migraciones Flyway. Se omite
 * localmente cuando Docker no está disponible, pero se ejecuta completa en CI.
 */
@SpringBootTest(properties = {
        "spring.task.scheduling.enabled=false",
        "utqallya.firebase.enabled=false",
        "utqallya.directions.enabled=false"
})
@Testcontainers(disabledWithoutDocker = true)
@Transactional
class TripLifecyclePostgresTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("utqallya_test")
                    .withUsername("test")
                    .withPassword("test");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired TripService tripService;
    @Autowired TripOfferService offerService;
    @Autowired RatingService ratingService;
    @Autowired RoleRepository roleRepository;
    @Autowired UserRepository userRepository;
    @Autowired VehicleRepository vehicleRepository;
    @Autowired DriverRepository driverRepository;
    @Autowired DriverLocationRepository locationRepository;
    @Autowired TripOfferRepository offerRepository;
    @Autowired TripRepository tripRepository;
    @Autowired NotificationRepository notificationRepository;

    @Test
    void completesRequestOfferSelectionArrivalPaymentAndRating() {
        User passenger = saveUser("Pasajero Integración", "passenger-it@example.com", "911111111", RoleName.PASSENGER);
        Driver firstDriver = saveDriver("Conductor Uno", "driver-one-it@example.com", "922222222", "IT1001");
        Driver secondDriver = saveDriver("Conductor Dos", "driver-two-it@example.com", "933333333", "IT1002");
        Driver mototaxiDriver = saveDriver("Conductor Moto", "driver-moto-it@example.com", "944444444",
                "IT1003", VehicleType.MOTOTAXI, DriverApprovalStatus.APPROVED);
        Driver pendingDriver = saveDriver("Conductor Pendiente", "driver-pending-it@example.com", "955555555",
                "IT1004", VehicleType.CAR, DriverApprovalStatus.PENDING);

        var requested = tripService.requestTrip(passenger, new CreateTripRequest(
                new GeoPointRequest(-15.4419, -74.6170, "Origen"),
                new GeoPointRequest(-15.4519, -74.6170, "Destino"),
                PaymentMethodCode.CASH,
                VehicleType.CAR));
        assertThat(notificationRepository.countByUserAndReadFalse(firstDriver.getUser())).isEqualTo(1);
        assertThat(notificationRepository.countByUserAndReadFalse(mototaxiDriver.getUser())).isZero();
        assertThat(notificationRepository.countByUserAndReadFalse(pendingDriver.getUser())).isZero();
        assertThatThrownBy(() -> offerService.createOrUpdate(pendingDriver.getUser(), requested.id(),
                new CreateTripOfferRequest(new BigDecimal("11.00"))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("aprobado");
        var firstOffer = offerService.createOrUpdate(firstDriver.getUser(), requested.id(),
                new CreateTripOfferRequest(new BigDecimal("12.50")));
        offerService.createOrUpdate(secondDriver.getUser(), requested.id(),
                new CreateTripOfferRequest(new BigDecimal("14.00")));

        var selected = offerService.select(passenger, requested.id(), firstOffer.id());
        assertThat(selected.status()).isEqualTo(TripStatus.DRIVER_ARRIVING);
        assertThat(selected.driver().id()).isEqualTo(firstDriver.getId());
        assertThat(offerRepository.findByTripIdAndStatusOrderByAmountAscCreatedAtAsc(
                requested.id(), TripOfferStatus.REJECTED)).hasSize(1);
        assertThatThrownBy(() -> offerService.select(passenger, requested.id(), firstOffer.id()))
                .isInstanceOf(ConflictException.class);

        tripService.markDriverArrived(firstDriver.getUser(), requested.id());
        assertThatThrownBy(() -> tripService.confirmCode(firstDriver.getUser(), requested.id(),
                new ConfirmCodeRequest("0000")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("incorrecto");
        assertThat(tripRepository.findById(requested.id()).orElseThrow().getStatus())
                .isEqualTo(TripStatus.WAITING_CONFIRMATION);
        tripService.confirmCode(firstDriver.getUser(), requested.id(),
                new ConfirmCodeRequest(requested.confirmationCode()));
        tripService.finishTrip(firstDriver.getUser(), requested.id());
        tripService.confirmPayment(passenger, requested.id());
        ratingService.rateTrip(passenger, requested.id(), new CreateRatingRequest(5, "Excelente"));

        var persisted = tripRepository.findById(requested.id()).orElseThrow();
        assertThat(persisted.getStatus()).isEqualTo(TripStatus.RATED);
        assertThat(persisted.getPassengerPaymentConfirmedAt()).isNotNull();
        assertThat(driverRepository.findById(firstDriver.getId()).orElseThrow().getRatingAverage()).isEqualTo(5.0);
    }

    private User saveUser(String name, String email, String phone, RoleName roleName) {
        return userRepository.save(User.builder()
                .fullName(name).email(email).phone(phone).passwordHash("test-hash")
                .role(roleRepository.findByName(roleName).orElseThrow()).build());
    }

    private Driver saveDriver(String name, String email, String phone, String plate) {
        return saveDriver(name, email, phone, plate, VehicleType.CAR, DriverApprovalStatus.APPROVED);
    }

    private Driver saveDriver(String name, String email, String phone, String plate,
                              VehicleType vehicleType, DriverApprovalStatus approvalStatus) {
        User user = saveUser(name, email, phone, RoleName.DRIVER);
        Vehicle vehicle = vehicleRepository.save(Vehicle.builder()
                .type(vehicleType).plate(plate).photoUrl("https://example.test/car.jpg").build());
        Driver driver = driverRepository.save(Driver.builder()
                .user(user).vehicle(vehicle).dniNumber(phone.substring(0, 8))
                .dniPhotoUrl("dni").licensePhotoUrl("license").soatPhotoUrl("soat")
                .approvalStatus(approvalStatus)
                .availability(DriverAvailability.AVAILABLE)
                .ratingAverage(0.0).totalRatings(0).totalTrips(0).build());
        locationRepository.save(DriverLocation.builder().driver(driver)
                .latitude(-15.4420).longitude(-74.6171).heading(0.0).build());
        return driver;
    }
}
