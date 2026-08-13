package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.TripOffer;
import com.utqallya.backend.entity.enums.TripOfferStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TripOfferResponse(
        UUID id,
        UUID tripId,
        BigDecimal amount,
        TripOfferStatus status,
        DriverResponse driver,
        Instant createdAt
) {
    public static TripOfferResponse from(TripOffer offer) {
        return new TripOfferResponse(offer.getId(), offer.getTrip().getId(), offer.getAmount(), offer.getStatus(),
                DriverResponse.forTrip(offer.getDriver(), false), offer.getCreatedAt());
    }
}
