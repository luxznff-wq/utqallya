package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.CreateRatingRequest;
import com.utqallya.backend.dto.response.RatingResponse;
import com.utqallya.backend.entity.User;

import java.util.UUID;

public interface RatingService {

    /** El pasajero califica un viaje ya finalizado; el viaje pasa a estado RATED. */
    RatingResponse rateTrip(User passenger, UUID tripId, CreateRatingRequest request);
}
