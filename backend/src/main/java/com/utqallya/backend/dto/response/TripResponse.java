package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.Trip;
import com.utqallya.backend.entity.enums.TripStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Representación de un viaje para el cliente. El código de confirmación
 * ({@code confirmationCode}) solo se incluye cuando el destinatario es el
 * pasajero: el conductor jamás debe recibirlo por API, ya que se lo debe
 * proporcionar verbalmente el pasajero al llegar (ver {@code #forDriver}).
 */
public record TripResponse(
        UUID id,
        TripStatus status,
        GeoLocationResponse origin,
        GeoLocationResponse destination,
        PaymentMethodResponse paymentMethod,
        Double distanceKm,
        Integer estimatedDurationMinutes,
        Double fare,
        Integer searchRadiusMeters,
        String confirmationCode,
        DriverResponse driver,
        UserResponse passenger,
        Instant createdAt,
        Instant acceptedAt,
        Instant driverArrivedAt,
        Instant startedAt,
        Instant finishedAt,
        Instant cancelledAt,
        String cancelReason
) {

    public static TripResponse forPassenger(Trip trip) {
        return build(trip, trip.getConfirmationCode());
    }

    public static TripResponse forDriver(Trip trip) {
        return build(trip, null);
    }

    public static TripResponse forAdmin(Trip trip) {
        return build(trip, trip.getConfirmationCode());
    }

    private static TripResponse build(Trip trip, String exposedCode) {
        return new TripResponse(
                trip.getId(),
                trip.getStatus(),
                GeoLocationResponse.from(trip.getOrigin()),
                GeoLocationResponse.from(trip.getDestination()),
                PaymentMethodResponse.from(trip.getPaymentMethod()),
                trip.getDistanceKm(),
                trip.getEstimatedDurationMinutes(),
                trip.getFare(),
                trip.getSearchRadiusMeters(),
                exposedCode,
                trip.getDriver() != null ? DriverResponse.from(trip.getDriver()) : null,
                UserResponse.from(trip.getPassenger()),
                trip.getCreatedAt(),
                trip.getAcceptedAt(),
                trip.getDriverArrivedAt(),
                trip.getStartedAt(),
                trip.getFinishedAt(),
                trip.getCancelledAt(),
                trip.getCancelReason()
        );
    }
}
