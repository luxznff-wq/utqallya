package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.CancelTripRequest;
import com.utqallya.backend.dto.request.ConfirmCodeRequest;
import com.utqallya.backend.dto.request.CreateTripRequest;
import com.utqallya.backend.dto.response.DriverLocationResponse;
import com.utqallya.backend.dto.response.TripResponse;
import com.utqallya.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

/**
 * Orquesta el ciclo de vida completo de un viaje. Ver {@code TripStatus} para
 * el flujo de estados; esta interfaz expone una operación por transición.
 */
public interface TripService {

    /** El pasajero solicita un viaje; se notifica a todos los conductores disponibles dentro del radio. */
    TripResponse requestTrip(User passenger, CreateTripRequest request);

    /** El conductor marca que llegó al punto de recogida; el pasajero debe dictarle el código. */
    TripResponse markDriverArrived(User driverUser, UUID tripId);

    /** El conductor ingresa el código dictado por el pasajero para iniciar el viaje. */
    TripResponse confirmCode(User driverUser, UUID tripId, ConfirmCodeRequest request);

    /** El conductor marca el viaje como finalizado al llegar al destino. */
    TripResponse finishTrip(User driverUser, UUID tripId);

    /** El pasajero o el conductor asignado cancelan el viaje (solo permitido antes de iniciar). */
    TripResponse cancelTrip(User actor, UUID tripId, CancelTripRequest request);

    TripResponse confirmPayment(User actor, UUID tripId);

    TripResponse getTripForPassenger(User passenger, UUID tripId);

    TripResponse getTripForDriver(User driverUser, UUID tripId);

    Optional<TripResponse> getActiveTrip(User user, boolean driver);

    /** Última posición conocida del conductor asignado, para dibujarla en el mapa del pasajero. */
    DriverLocationResponse getDriverLocationForTrip(User passenger, UUID tripId);

    Page<TripResponse> getPassengerHistory(User passenger, Pageable pageable);

    Page<TripResponse> getDriverHistory(User driverUser, Pageable pageable);
}
