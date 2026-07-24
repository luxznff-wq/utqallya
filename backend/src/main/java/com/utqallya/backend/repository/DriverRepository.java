package com.utqallya.backend.repository;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DriverRepository extends JpaRepository<Driver, UUID> {

    Optional<Driver> findByUser(User user);

    Optional<Driver> findByUserId(UUID userId);

    Page<Driver> findByApprovalStatus(DriverApprovalStatus status, Pageable pageable);

    long countByApprovalStatus(DriverApprovalStatus status);

    /** Promedio de calificación entre los conductores que ya recibieron al menos una calificación. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT COALESCE(AVG(d.ratingAverage), 0) FROM Driver d WHERE d.totalRatings > 0")
    double averageRatingAcrossDrivers();
}
