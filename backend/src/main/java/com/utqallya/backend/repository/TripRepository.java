package com.utqallya.backend.repository;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.Trip;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.TripStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, UUID> {

    Page<Trip> findByPassengerOrderByCreatedAtDesc(User passenger, Pageable pageable);

    Page<Trip> findByDriverIdOrderByCreatedAtDesc(UUID driverId, Pageable pageable);

    Optional<Trip> findByIdAndPassenger(UUID id, User passenger);

    List<Trip> findByPassengerAndStatusIn(User passenger, List<TripStatus> statuses);

    List<Trip> findByDriverIdAndStatusIn(UUID driverId, List<TripStatus> statuses);

    long countByStatus(TripStatus status);

    long countByStatusIn(List<TripStatus> statuses);

    long countByCreatedAtAfter(Instant threshold);

    long countByDriverIdAndStatus(UUID driverId, TripStatus status);

    /** Usado por el job de expiración: viajes que llevan demasiado tiempo sin conductor. */
    List<Trip> findByStatusAndCreatedAtBefore(TripStatus status, Instant threshold);

    /**
     * Asignación atómica de conductor: solo tiene efecto si el viaje sigue
     * {@code SEARCHING_DRIVER} y sin conductor asignado. Esto garantiza que,
     * cuando varios conductores presionan "aceptar" casi al mismo tiempo,
     * únicamente el primero cuya escritura llegue a la base de datos gane el viaje
     * (fila = 1 actualizada); los demás reciben 0 filas afectadas y deben
     * informar al conductor que el viaje ya no está disponible.
     */
    @Modifying
    @Query("""
            UPDATE Trip t
               SET t.driver = :driver,
                   t.status = com.utqallya.backend.entity.enums.TripStatus.ACCEPTED,
                   t.acceptedAt = :now
             WHERE t.id = :tripId
               AND t.status = com.utqallya.backend.entity.enums.TripStatus.SEARCHING_DRIVER
               AND t.driver IS NULL
            """)
    int tryAssignDriver(@Param("tripId") UUID tripId, @Param("driver") Driver driver, @Param("now") Instant now);
}
