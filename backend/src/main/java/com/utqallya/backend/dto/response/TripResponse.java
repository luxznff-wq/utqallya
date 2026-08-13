package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.Trip;
import com.utqallya.backend.entity.enums.TripStatus;
import com.utqallya.backend.entity.enums.VehicleType;
import com.utqallya.backend.entity.enums.CancelledBy;
import com.utqallya.backend.entity.enums.PaymentMethodCode;

import java.time.Instant;
import java.util.UUID;
import java.math.BigDecimal;

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
        VehicleType vehicleType,
        Double distanceKm,
        Integer estimatedDurationMinutes,
        BigDecimal agreedFare,
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
        Instant passengerPaymentConfirmedAt,
        Instant driverPaymentConfirmedAt,
        String cancelReason,
        CancelledBy cancelledBy
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
                trip.getVehicleType(),
                trip.getDistanceKm(),
                trip.getEstimatedDurationMinutes(),
                trip.getAgreedFare(),
                trip.getSearchRadiusMeters(),
                exposedCode,
                trip.getDriver() != null
                        ? DriverResponse.forTrip(trip.getDriver(),
                                trip.getPaymentMethod().getCode() == PaymentMethodCode.YAPE)
                        : null,
                UserResponse.from(trip.getPassenger()),
                trip.getCreatedAt(),
                trip.getAcceptedAt(),
                trip.getDriverArrivedAt(),
                trip.getStartedAt(),
                trip.getFinishedAt(),
                trip.getCancelledAt(),
                trip.getPassengerPaymentConfirmedAt(),
                trip.getDriverPaymentConfirmedAt(),
                trip.getCancelReason(),
                trip.getCancelledBy()
        );
    }
}
