package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.CreateTripOfferRequest;
import com.utqallya.backend.dto.response.TripOfferResponse;
import com.utqallya.backend.dto.response.TripResponse;
import com.utqallya.backend.entity.User;

import java.util.List;
import java.util.UUID;

public interface TripOfferService {
    TripOfferResponse createOrUpdate(User driverUser, UUID tripId, CreateTripOfferRequest request);
    List<TripOfferResponse> listForPassenger(User passenger, UUID tripId);
    List<TripOfferResponse> listMine(User driverUser);
    void withdraw(User driverUser, UUID tripId);
    TripResponse select(User passenger, UUID tripId, UUID offerId);
}
