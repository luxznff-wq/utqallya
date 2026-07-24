package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.Rating;

import java.util.UUID;

public record RatingResponse(
        UUID id,
        UUID tripId,
        Integer score,
        String comment
) {
    public static RatingResponse from(Rating rating) {
        return new RatingResponse(rating.getId(), rating.getTrip().getId(), rating.getScore(), rating.getComment());
    }
}
