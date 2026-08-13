package com.utqallya.backend.repository;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDate;
import java.util.List;

public interface DriverRepository extends JpaRepository<Driver, UUID> {

    Optional<Driver> findByUser(User user);

    Optional<Driver> findByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Driver d WHERE d.user.id = :userId")
    Optional<Driver> findByUserIdForUpdate(@Param("userId") UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Driver d WHERE d.id = :driverId")
    Optional<Driver> findByIdForUpdate(@Param("driverId") UUID driverId);

    Page<Driver> findByApprovalStatus(DriverApprovalStatus status, Pageable pageable);

    long countByApprovalStatus(DriverApprovalStatus status);

    /** Promedio de calificación entre los conductores que ya recibieron al menos una calificación. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT COALESCE(AVG(d.ratingAverage), 0) FROM Driver d WHERE d.totalRatings > 0")
    double averageRatingAcrossDrivers();

    @Query("SELECT d FROM Driver d WHERE d.licenseExpiresAt IS NULL OR d.soatExpiresAt IS NULL "
            + "OR d.licenseExpiresAt <= :limit OR d.soatExpiresAt <= :limit")
    List<Driver> findWithDocumentsExpiringBy(@Param("limit") LocalDate limit);
}
