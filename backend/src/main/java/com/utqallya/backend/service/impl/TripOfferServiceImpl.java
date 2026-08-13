package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.CreateTripOfferRequest;
import com.utqallya.backend.dto.response.TripOfferResponse;
import com.utqallya.backend.dto.response.TripResponse;
import com.utqallya.backend.entity.*;
import com.utqallya.backend.entity.enums.*;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.*;
import com.utqallya.backend.service.NotificationService;
import com.utqallya.backend.service.TripOfferService;
import com.utqallya.backend.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TripOfferServiceImpl implements TripOfferService {
    private final TripRepository tripRepository;
    private final TripOfferRepository offerRepository;
    private final DriverRepository driverRepository;
    private final DriverLocationRepository driverLocationRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public TripOfferResponse createOrUpdate(User driverUser, UUID tripId, CreateTripOfferRequest request) {
        Driver driver = driverRepository.findByUser(driverUser)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de conductor no encontrado"));
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado"));
        if (trip.getStatus() != TripStatus.SEARCHING_DRIVER || trip.getDriver() != null) {
            throw new ConflictException("El viaje ya no recibe ofertas");
        }
        if (driver.getApprovalStatus() != DriverApprovalStatus.APPROVED
                || driver.getAvailability() != DriverAvailability.AVAILABLE) {
            throw new BadRequestException("Debes estar aprobado y disponible para ofertar");
        }
        if (driver.getVehicle() == null || driver.getVehicle().getType() != trip.getVehicleType()) {
            throw new BadRequestException("El tipo de vehículo no coincide con la solicitud");
        }
        if (trip.getPaymentMethod().getCode() == PaymentMethodCode.YAPE
                && (driver.getYapePhone() == null || driver.getYapeHolderName() == null)) {
            throw new BadRequestException("Configura tus datos de Yape antes de ofertar");
        }
        DriverLocation location = driverLocationRepository.findByDriver(driver)
                .orElseThrow(() -> new BadRequestException("Actualiza tu ubicación antes de ofertar"));
        double distance = GeoUtils.distanceMeters(
                trip.getOrigin().getLatitude(), trip.getOrigin().getLongitude(),
                location.getLatitude(), location.getLongitude());
        if (distance > trip.getSearchRadiusMeters()) {
            throw new BadRequestException("La solicitud está fuera de tu radio de atención");
        }

        TripOffer offer = offerRepository.findByTripIdAndDriver(tripId, driver)
                .orElseGet(() -> TripOffer.builder().trip(trip).driver(driver).build());
        if (offer.getRevisionCount() >= 5) {
            throw new BadRequestException("Alcanzaste el límite de 5 cambios para esta oferta");
        }
        offer.setAmount(request.amount());
        offer.setStatus(TripOfferStatus.PENDING);
        offer.setRevisionCount(offer.getRevisionCount() + 1);
        TripOffer saved = offerRepository.save(offer);
        notificationService.notify(trip.getPassenger(), NotificationType.TRIP_OFFER_RECEIVED,
                "Nueva oferta de viaje",
                driver.getUser().getFullName() + " ofreció llevarte por S/ " + request.amount(), trip.getId());
        return TripOfferResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripOfferResponse> listForPassenger(User passenger, UUID tripId) {
        Trip trip = tripRepository.findByIdAndPassenger(tripId, passenger)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado"));
        return offerRepository.findByTripIdAndStatusOrderByAmountAscCreatedAtAsc(
                trip.getId(), TripOfferStatus.PENDING).stream().map(TripOfferResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripOfferResponse> listMine(User driverUser) {
        Driver driver = driverRepository.findByUser(driverUser)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de conductor no encontrado"));
        return offerRepository.findByDriverAndStatusOrderByUpdatedAtDesc(driver, TripOfferStatus.PENDING)
                .stream().filter(offer -> offer.getTrip().getStatus() == TripStatus.SEARCHING_DRIVER)
                .map(TripOfferResponse::from).toList();
    }

    @Override
    @Transactional
    public void withdraw(User driverUser, UUID tripId) {
        Driver driver = driverRepository.findByUser(driverUser)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de conductor no encontrado"));
        TripOffer offer = offerRepository.findByTripIdAndDriver(tripId, driver)
                .filter(candidate -> candidate.getStatus() == TripOfferStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Oferta pendiente no encontrada"));
        offer.setStatus(TripOfferStatus.WITHDRAWN);
        offerRepository.save(offer);
    }

    @Override
    @Transactional
    public TripResponse select(User passenger, UUID tripId, UUID offerId) {
        Trip trip = tripRepository.findByIdAndPassengerForUpdate(tripId, passenger)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado"));
        if (trip.getStatus() != TripStatus.SEARCHING_DRIVER || trip.getDriver() != null) {
            throw new ConflictException("El viaje ya tiene conductor o fue cancelado");
        }
        TripOffer selected = offerRepository.findById(offerId)
                .filter(offer -> offer.getTrip().getId().equals(tripId)
                        && offer.getStatus() == TripOfferStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Oferta no encontrada"));
        Driver driver = driverRepository.findByIdForUpdate(selected.getDriver().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conductor no encontrado"));
        if (driver.getAvailability() != DriverAvailability.AVAILABLE
                || driver.getApprovalStatus() != DriverApprovalStatus.APPROVED
                || !tripRepository.findByDriverIdAndStatusIn(driver.getId(),
                    List.of(TripStatus.ACCEPTED, TripStatus.DRIVER_ARRIVING,
                            TripStatus.WAITING_CONFIRMATION, TripStatus.IN_PROGRESS)).isEmpty()) {
            throw new ConflictException("El conductor ya no está disponible");
        }

        trip.setDriver(driver);
        trip.setStatus(TripStatus.DRIVER_ARRIVING);
        trip.setAcceptedAt(Instant.now());
        trip.setAgreedFare(selected.getAmount());
        driver.setAvailability(DriverAvailability.UNAVAILABLE);
        selected.setStatus(TripOfferStatus.SELECTED);
        offerRepository.findByTripIdAndStatusOrderByAmountAscCreatedAtAsc(tripId, TripOfferStatus.PENDING)
                .stream().filter(offer -> !offer.getId().equals(offerId))
                .forEach(offer -> offer.setStatus(TripOfferStatus.REJECTED));
        tripRepository.save(trip);
        driverRepository.save(driver);
        notificationService.notify(driver.getUser(), NotificationType.TRIP_OFFER_SELECTED,
                "Tu oferta fue elegida", "El pasajero eligió tu oferta de S/ " + selected.getAmount(), trip.getId());
        return TripResponse.forPassenger(trip);
    }
}
