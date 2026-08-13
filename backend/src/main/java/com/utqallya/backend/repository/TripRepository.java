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
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, UUID> {

    Page<Trip> findByPassengerOrderByCreatedAtDesc(User passenger, Pageable pageable);

    Page<Trip> findByDriverIdOrderByCreatedAtDesc(UUID driverId, Pageable pageable);

    Optional<Trip> findByIdAndPassenger(UUID id, User passenger);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Trip t WHERE t.id = :tripId AND t.passenger = :passenger")
    Optional<Trip> findByIdAndPassengerForUpdate(@Param("tripId") UUID tripId, @Param("passenger") User passenger);

    List<Trip> findByPassengerAndStatusIn(User passenger, List<TripStatus> statuses);

    List<Trip> findByDriverIdAndStatusIn(UUID driverId, List<TripStatus> statuses);

    long countByStatus(TripStatus status);

    long countByStatusIn(List<TripStatus> statuses);

    long countByCreatedAtAfter(Instant threshold);

    long countByDriverIdAndStatus(UUID driverId, TripStatus status);

    /** Usado por el job de expiración: viajes que llevan demasiado tiempo sin conductor. */
    List<Trip> findByStatusAndCreatedAtBefore(TripStatus status, Instant threshold);

}
