package com.utqallya.backend.repository;

import com.utqallya.backend.entity.Rating;
import com.utqallya.backend.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RatingRepository extends JpaRepository<Rating, UUID> {

    Optional<Rating> findByTrip(Trip trip);

    boolean existsByTrip(Trip trip);
}
