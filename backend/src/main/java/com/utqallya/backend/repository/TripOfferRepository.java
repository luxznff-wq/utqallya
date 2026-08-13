package com.utqallya.backend.repository;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.TripOffer;
import com.utqallya.backend.entity.enums.TripOfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripOfferRepository extends JpaRepository<TripOffer, UUID> {
    Optional<TripOffer> findByTripIdAndDriver(UUID tripId, Driver driver);
    List<TripOffer> findByTripIdAndStatusOrderByAmountAscCreatedAtAsc(UUID tripId, TripOfferStatus status);
    List<TripOffer> findByDriverAndStatusOrderByUpdatedAtDesc(Driver driver, TripOfferStatus status);

    @Modifying
    @Query("UPDATE TripOffer o SET o.status = com.utqallya.backend.entity.enums.TripOfferStatus.EXPIRED "
            + "WHERE o.trip.id = :tripId AND o.status = com.utqallya.backend.entity.enums.TripOfferStatus.PENDING")
    int expirePendingByTripId(@Param("tripId") UUID tripId);

    long countByStatus(TripOfferStatus status);

    @Query("SELECT COALESCE(AVG(o.amount), 0) FROM TripOffer o WHERE o.status = "
            + "com.utqallya.backend.entity.enums.TripOfferStatus.SELECTED")
    double averageSelectedAmount();
}
