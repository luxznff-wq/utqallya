package com.utqallya.backend.service.impl;

import com.utqallya.backend.config.AppProperties;
import com.utqallya.backend.dto.request.CancelTripRequest;
import com.utqallya.backend.dto.request.ConfirmCodeRequest;
import com.utqallya.backend.dto.request.CreateTripRequest;
import com.utqallya.backend.dto.response.DriverLocationResponse;
import com.utqallya.backend.dto.response.TripResponse;
import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.DriverLocation;
import com.utqallya.backend.entity.GeoLocation;
import com.utqallya.backend.entity.Trip;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.Vehicle;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;
import com.utqallya.backend.entity.enums.CancelledBy;
import com.utqallya.backend.entity.enums.NotificationType;
import com.utqallya.backend.entity.enums.PaymentMethodCode;
import com.utqallya.backend.entity.enums.TripStatus;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.DriverLocationRepository;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.GeoLocationRepository;
import com.utqallya.backend.repository.PaymentMethodRepository;
import com.utqallya.backend.repository.TripRepository;
import com.utqallya.backend.repository.TripOfferRepository;
import com.utqallya.backend.service.DirectionsService;
import com.utqallya.backend.service.NotificationService;
import com.utqallya.backend.service.TripService;
import com.utqallya.backend.util.GeoUtils;
import com.utqallya.backend.util.TripCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementación del ciclo de vida después de que el pasajero elige una oferta.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private static final int MAX_CONFIRMATION_ATTEMPTS = 5;
    private static final List<TripStatus> ACTIVE_PASSENGER_STATUSES = List.of(
            TripStatus.REQUESTED, TripStatus.SEARCHING_DRIVER, TripStatus.ACCEPTED,
            TripStatus.DRIVER_ARRIVING, TripStatus.WAITING_CONFIRMATION, TripStatus.IN_PROGRESS
    );

    private final TripRepository tripRepository;
    private final TripOfferRepository tripOfferRepository;
    private final GeoLocationRepository geoLocationRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final DriverRepository driverRepository;
    private final DriverLocationRepository driverLocationRepository;
    private final NotificationService notificationService;
    private final DirectionsService directionsService;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public TripResponse requestTrip(User passenger, CreateTripRequest request) {
        if (!tripRepository.findByPassengerAndStatusIn(passenger, ACTIVE_PASSENGER_STATUSES).isEmpty()) {
            throw new ConflictException("Ya tienes un viaje en curso");
        }
        double directDistanceMeters = GeoUtils.distanceMeters(
                request.origin().latitude(), request.origin().longitude(),
                request.destination().latitude(), request.destination().longitude());
        if (directDistanceMeters < 50) {
            throw new BadRequestException("El origen y el destino deben estar separados por al menos 50 metros");
        }

        GeoLocation origin = geoLocationRepository.save(GeoLocation.builder()
                .latitude(request.origin().latitude())
                .longitude(request.origin().longitude())
                .address(request.origin().address())
                .build());

        GeoLocation destination = geoLocationRepository.save(GeoLocation.builder()
                .latitude(request.destination().latitude())
                .longitude(request.destination().longitude())
                .address(request.destination().address())
                .build());

        var paymentMethod = paymentMethodRepository.findByCode(request.paymentMethod())
                .orElseThrow(() -> new IllegalStateException("Método de pago no sembrado: " + request.paymentMethod()));

        var route = directionsService.getRoute(origin.getLatitude(), origin.getLongitude(),
                destination.getLatitude(), destination.getLongitude());
        double distanceKm = route.distanceKm();
        int etaMinutes = route.durationMinutes();

        Trip trip = Trip.builder()
                .passenger(passenger)
                .origin(origin)
                .destination(destination)
                .paymentMethod(paymentMethod)
                .vehicleType(request.vehicleType())
                .status(TripStatus.SEARCHING_DRIVER)
                .confirmationCode(TripCodeGenerator.generate(appProperties.getTrip().getConfirmationCodeLength()))
                .distanceKm(distanceKm)
                .estimatedDurationMinutes(etaMinutes)
                .searchRadiusMeters(appProperties.getTrip().getSearchRadiusMeters())
                .build();
        tripRepository.save(trip);

        notifyNearbyDrivers(trip, origin);

        return TripResponse.forPassenger(trip);
    }

    private void notifyNearbyDrivers(Trip trip, GeoLocation origin) {
        List<DriverLocation> candidates = driverLocationRepository
                .findByDriverApprovalStatusAndDriverAvailability(DriverApprovalStatus.APPROVED, DriverAvailability.AVAILABLE);

        for (DriverLocation location : candidates) {
            Vehicle vehicle = location.getDriver().getVehicle();
            if (vehicle == null || vehicle.getType() != trip.getVehicleType()) {
                continue;
            }
            if (trip.getPaymentMethod().getCode() == PaymentMethodCode.YAPE
                    && !hasYapeConfigured(location.getDriver())) {
                continue;
            }
            double distance = GeoUtils.distanceMeters(
                    origin.getLatitude(), origin.getLongitude(), location.getLatitude(), location.getLongitude());
            if (distance <= trip.getSearchRadiusMeters()) {
                notificationService.notify(
                        location.getDriver().getUser(),
                        NotificationType.TRIP_REQUEST,
                        "Nuevo viaje disponible",
                        "Hay un pasajero solicitando un viaje cerca de ti",
                        trip.getId()
                );
            }
        }
    }

    @Override
    @Transactional
    public TripResponse markDriverArrived(User driverUser, UUID tripId) {
        Trip trip = getOwnedTripForDriver(driverUser, tripId);
        requireStatus(trip, TripStatus.DRIVER_ARRIVING);

        trip.setStatus(TripStatus.WAITING_CONFIRMATION);
        trip.setDriverArrivedAt(Instant.now());
        tripRepository.save(trip);

        notificationService.notify(trip.getPassenger(), NotificationType.DRIVER_ARRIVED,
                "Tu conductor ha llegado", "Dicta el código de confirmación a tu conductor para iniciar el viaje", trip.getId());

        return TripResponse.forDriver(trip);
    }

    @Override
    @Transactional(noRollbackFor = BadRequestException.class)
    public TripResponse confirmCode(User driverUser, UUID tripId, ConfirmCodeRequest request) {
        Trip trip = getOwnedTripForDriver(driverUser, tripId);
        requireStatus(trip, TripStatus.WAITING_CONFIRMATION);

        if (trip.getConfirmationAttempts() >= MAX_CONFIRMATION_ATTEMPTS) {
            throw new BadRequestException(
                    "Se alcanzó el límite de intentos. El pasajero debe cancelar y solicitar otro viaje");
        }
        if (!trip.getConfirmationCode().equals(request.code())) {
            trip.setConfirmationAttempts(trip.getConfirmationAttempts() + 1);
            tripRepository.save(trip);
            throw new BadRequestException("El código ingresado es incorrecto");
        }

        trip.setStatus(TripStatus.IN_PROGRESS);
        trip.setStartedAt(Instant.now());
        tripRepository.save(trip);

        notificationService.notify(trip.getPassenger(), NotificationType.TRIP_STARTED,
                "Viaje iniciado", "Tu viaje ha comenzado. ¡Buen viaje!", trip.getId());

        return TripResponse.forDriver(trip);
    }

    @Override
    @Transactional
    public TripResponse finishTrip(User driverUser, UUID tripId) {
        Trip trip = getOwnedTripForDriver(driverUser, tripId);
        requireStatus(trip, TripStatus.IN_PROGRESS);

        trip.setStatus(TripStatus.FINISHED);
        trip.setFinishedAt(Instant.now());
        tripRepository.save(trip);

        Driver driver = trip.getDriver();
        driver.setTotalTrips(driver.getTotalTrips() + 1);
        driver.setAvailability(DriverAvailability.AVAILABLE);
        driverRepository.save(driver);

        notificationService.notify(trip.getPassenger(), NotificationType.TRIP_FINISHED,
                "Viaje finalizado", "Tu viaje ha finalizado. No olvides calificar a tu conductor", trip.getId());

        return TripResponse.forDriver(trip);
    }

    @Override
    @Transactional
    public TripResponse cancelTrip(User actor, UUID tripId, CancelTripRequest request) {
        Trip trip = getTripOrThrow(tripId);

        boolean isPassenger = trip.getPassenger().getId().equals(actor.getId());
        boolean isDriver = trip.getDriver() != null && trip.getDriver().getUser().getId().equals(actor.getId());

        if (!isPassenger && !isDriver) {
            throw new ResourceNotFoundException("Viaje no encontrado");
        }
        if (!ACTIVE_PASSENGER_STATUSES.contains(trip.getStatus()) || trip.getStatus() == TripStatus.IN_PROGRESS) {
            throw new BadRequestException("Este viaje ya no puede cancelarse en su estado actual");
        }

        trip.setStatus(TripStatus.CANCELLED);
        trip.setCancelledAt(Instant.now());
        trip.setCancelReason(request.reason().trim());
        trip.setCancelledBy(isPassenger ? CancelledBy.PASSENGER : CancelledBy.DRIVER);
        tripRepository.save(trip);
        tripOfferRepository.expirePendingByTripId(trip.getId());

        if (trip.getDriver() != null) {
            Driver driver = trip.getDriver();
            driver.setAvailability(DriverAvailability.AVAILABLE);
            driverRepository.save(driver);
        }

        User counterpart = isPassenger ? (trip.getDriver() != null ? trip.getDriver().getUser() : null) : trip.getPassenger();
        if (counterpart != null) {
            notificationService.notify(counterpart, NotificationType.TRIP_CANCELLED,
                    "Viaje cancelado", "El viaje ha sido cancelado", trip.getId());
        }

        return isPassenger ? TripResponse.forPassenger(trip) : TripResponse.forDriver(trip);
    }

    @Override
    @Transactional
    public TripResponse confirmPayment(User actor, UUID tripId) {
        Trip trip = getTripOrThrow(tripId);
        boolean isPassenger = trip.getPassenger().getId().equals(actor.getId());
        boolean isDriver = trip.getDriver() != null && trip.getDriver().getUser().getId().equals(actor.getId());
        if (!isPassenger && !isDriver) {
            throw new ResourceNotFoundException("Viaje no encontrado");
        }
        if (trip.getStatus() != TripStatus.FINISHED && trip.getStatus() != TripStatus.RATED) {
            throw new BadRequestException("El pago sólo puede confirmarse después de finalizar el viaje");
        }
        boolean newlyConfirmed = false;
        if (isPassenger && trip.getPassengerPaymentConfirmedAt() == null) {
            trip.setPassengerPaymentConfirmedAt(Instant.now());
            newlyConfirmed = true;
        }
        if (isDriver && trip.getDriverPaymentConfirmedAt() == null) {
            trip.setDriverPaymentConfirmedAt(Instant.now());
            newlyConfirmed = true;
        }
        tripRepository.save(trip);
        if (newlyConfirmed) {
            User counterpart = isPassenger ? trip.getDriver().getUser() : trip.getPassenger();
            notificationService.notify(counterpart, NotificationType.PAYMENT_CONFIRMED,
                    "Confirmación de pago",
                    isPassenger ? "El pasajero confirmó el pago del viaje."
                            : "El conductor confirmó haber recibido el pago.",
                    trip.getId());
        }
        return isPassenger ? TripResponse.forPassenger(trip) : TripResponse.forDriver(trip);
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTripForPassenger(User passenger, UUID tripId) {
        Trip trip = tripRepository.findByIdAndPassenger(tripId, passenger)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado"));
        return TripResponse.forPassenger(trip);
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTripForDriver(User driverUser, UUID tripId) {
        return TripResponse.forDriver(getOwnedTripForDriver(driverUser, tripId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TripResponse> getActiveTrip(User user, boolean driverRole) {
        if (driverRole) {
            Driver driver = getDriverByUser(user);
            return tripRepository.findByDriverIdAndStatusIn(driver.getId(), ACTIVE_PASSENGER_STATUSES)
                    .stream().findFirst().map(TripResponse::forDriver);
        }
        return tripRepository.findByPassengerAndStatusIn(user, ACTIVE_PASSENGER_STATUSES)
                .stream().findFirst().map(TripResponse::forPassenger);
    }

    @Override
    @Transactional(readOnly = true)
    public DriverLocationResponse getDriverLocationForTrip(User passenger, UUID tripId) {
        Trip trip = tripRepository.findByIdAndPassenger(tripId, passenger)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado"));

        if (trip.getDriver() == null) {
            throw new ResourceNotFoundException("Este viaje todavía no tiene un conductor asignado");
        }

        return driverLocationRepository.findByDriver(trip.getDriver())
                .map(DriverLocationResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("El conductor aún no reportó su ubicación"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TripResponse> getPassengerHistory(User passenger, Pageable pageable) {
        return tripRepository.findByPassengerOrderByCreatedAtDesc(passenger, pageable).map(TripResponse::forPassenger);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TripResponse> getDriverHistory(User driverUser, Pageable pageable) {
        Driver driver = getDriverByUser(driverUser);
        return tripRepository.findByDriverIdOrderByCreatedAtDesc(driver.getId(), pageable).map(TripResponse::forDriver);
    }

    /**
     * Cancela automáticamente los viajes que llevan demasiado tiempo sin conductor,
     * para que el pasajero no quede esperando indefinidamente si nadie acepta.
     */
    @Scheduled(fixedDelayString = "PT30S")
    @Transactional
    public void expireStaleSearchingTrips() {
        Instant threshold = Instant.now().minus(
                appProperties.getTrip().getDriverResponseTimeoutSeconds(), ChronoUnit.SECONDS);

        List<Trip> stale = tripRepository.findByStatusAndCreatedAtBefore(TripStatus.SEARCHING_DRIVER, threshold);
        for (Trip trip : stale) {
            trip.setStatus(TripStatus.CANCELLED);
            trip.setCancelledAt(Instant.now());
            trip.setCancelReason("No se encontró un conductor disponible dentro del tiempo límite");
            trip.setCancelledBy(CancelledBy.SYSTEM);
            tripRepository.save(trip);
            tripOfferRepository.expirePendingByTripId(trip.getId());

            notificationService.notify(trip.getPassenger(), NotificationType.TRIP_CANCELLED,
                    "No encontramos un conductor", "Ningún conductor disponible aceptó tu viaje. Inténtalo nuevamente.", trip.getId());
        }
    }

    private Driver getDriverByUser(User user) {
        return driverRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de conductor no encontrado"));
    }

    private boolean hasYapeConfigured(Driver driver) {
        return driver.getYapePhone() != null && !driver.getYapePhone().isBlank()
                && driver.getYapeHolderName() != null && !driver.getYapeHolderName().isBlank();
    }

    private Trip getTripOrThrow(UUID tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado"));
    }

    private Trip getOwnedTripForDriver(User driverUser, UUID tripId) {
        Driver driver = getDriverByUser(driverUser);
        Trip trip = getTripOrThrow(tripId);

        if (trip.getDriver() == null || !trip.getDriver().getId().equals(driver.getId())) {
            throw new ResourceNotFoundException("Viaje no encontrado");
        }
        return trip;
    }

    private void requireStatus(Trip trip, TripStatus expected) {
        if (trip.getStatus() != expected) {
            throw new BadRequestException("El viaje no está en un estado válido para esta acción");
        }
    }
}
