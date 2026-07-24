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
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;
import com.utqallya.backend.entity.enums.NotificationType;
import com.utqallya.backend.entity.enums.TripStatus;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.DriverLocationRepository;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.GeoLocationRepository;
import com.utqallya.backend.repository.PaymentMethodRepository;
import com.utqallya.backend.repository.TripRepository;
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
import java.util.UUID;

/**
 * Implementación del ciclo de vida de un viaje. No hay negociación de precio,
 * subasta ni chat: el primer conductor disponible que acepta se queda con el
 * viaje (ver {@code TripRepository#tryAssignDriver} para la garantía atómica).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private static final List<TripStatus> ACTIVE_PASSENGER_STATUSES = List.of(
            TripStatus.REQUESTED, TripStatus.SEARCHING_DRIVER, TripStatus.ACCEPTED,
            TripStatus.DRIVER_ARRIVING, TripStatus.WAITING_CONFIRMATION, TripStatus.IN_PROGRESS
    );

    private final TripRepository tripRepository;
    private final GeoLocationRepository geoLocationRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final DriverRepository driverRepository;
    private final DriverLocationRepository driverLocationRepository;
    private final NotificationService notificationService;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public TripResponse requestTrip(User passenger, CreateTripRequest request) {
        if (!tripRepository.findByPassengerAndStatusIn(passenger, ACTIVE_PASSENGER_STATUSES).isEmpty()) {
            throw new ConflictException("Ya tienes un viaje en curso");
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

        double distanceKm = GeoUtils.distanceKm(origin.getLatitude(), origin.getLongitude(),
                destination.getLatitude(), destination.getLongitude());
        int etaMinutes = (int) Math.max(1, Math.ceil(distanceKm / appProperties.getTrip().getAverageSpeedKmh() * 60));
        double fare = Math.round((appProperties.getTrip().getBaseFare()
                + appProperties.getTrip().getFarePerKm() * distanceKm) * 100.0) / 100.0;

        Trip trip = Trip.builder()
                .passenger(passenger)
                .origin(origin)
                .destination(destination)
                .paymentMethod(paymentMethod)
                .status(TripStatus.SEARCHING_DRIVER)
                .confirmationCode(TripCodeGenerator.generate(appProperties.getTrip().getConfirmationCodeLength()))
                .distanceKm(distanceKm)
                .estimatedDurationMinutes(etaMinutes)
                .fare(fare)
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
    public TripResponse acceptTrip(User driverUser, UUID tripId) {
        Driver driver = getDriverByUser(driverUser);

        if (driver.getApprovalStatus() != DriverApprovalStatus.APPROVED) {
            throw new BadRequestException("Tu documentación aún no ha sido aprobada");
        }
        if (driver.getAvailability() != DriverAvailability.AVAILABLE) {
            throw new BadRequestException("Debes estar disponible para aceptar viajes");
        }

        int updatedRows = tripRepository.tryAssignDriver(tripId, driver, Instant.now());
        if (updatedRows == 0) {
            throw new ConflictException("Este viaje ya no está disponible: otro conductor lo tomó o fue cancelado");
        }

        // El conductor queda reservado para este viaje hasta que finalice o se cancele.
        driver.setAvailability(DriverAvailability.UNAVAILABLE);
        driverRepository.save(driver);

        Trip trip = getTripOrThrow(tripId);
        trip.setStatus(TripStatus.DRIVER_ARRIVING);
        tripRepository.save(trip);

        notificationService.notify(trip.getPassenger(), NotificationType.TRIP_ACCEPTED,
                "Conductor asignado", driver.getUser().getFullName() + " aceptó tu viaje y va en camino", trip.getId());

        return TripResponse.forDriver(trip);
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
    @Transactional
    public TripResponse confirmCode(User driverUser, UUID tripId, ConfirmCodeRequest request) {
        Trip trip = getOwnedTripForDriver(driverUser, tripId);
        requireStatus(trip, TripStatus.WAITING_CONFIRMATION);

        if (!trip.getConfirmationCode().equals(request.code())) {
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
        trip.setCancelReason(request.reason());
        tripRepository.save(trip);

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
            tripRepository.save(trip);

            notificationService.notify(trip.getPassenger(), NotificationType.TRIP_CANCELLED,
                    "No encontramos un conductor", "Ningún conductor disponible aceptó tu viaje. Inténtalo nuevamente.", trip.getId());
        }
    }

    private Driver getDriverByUser(User user) {
        return driverRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de conductor no encontrado"));
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
