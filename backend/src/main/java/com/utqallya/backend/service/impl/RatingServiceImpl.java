package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.CreateRatingRequest;
import com.utqallya.backend.dto.response.RatingResponse;
import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.Rating;
import com.utqallya.backend.entity.Trip;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.TripStatus;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.RatingRepository;
import com.utqallya.backend.repository.TripRepository;
import com.utqallya.backend.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final TripRepository tripRepository;
    private final DriverRepository driverRepository;

    @Override
    @Transactional
    public RatingResponse rateTrip(User passenger, UUID tripId, CreateRatingRequest request) {
        Trip trip = tripRepository.findByIdAndPassenger(tripId, passenger)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado"));

        if (trip.getStatus() != TripStatus.FINISHED) {
            throw new BadRequestException("Solo se pueden calificar viajes finalizados");
        }
        if (ratingRepository.existsByTrip(trip)) {
            throw new ConflictException("Este viaje ya fue calificado");
        }

        Rating rating = Rating.builder()
                .trip(trip)
                .score(request.score())
                .comment(request.comment())
                .build();
        ratingRepository.save(rating);

        trip.setStatus(TripStatus.RATED);
        tripRepository.save(trip);

        Driver driver = trip.getDriver();
        double newAverage = (driver.getRatingAverage() * driver.getTotalRatings() + request.score())
                / (driver.getTotalRatings() + 1);
        driver.setRatingAverage(Math.round(newAverage * 100.0) / 100.0);
        driver.setTotalRatings(driver.getTotalRatings() + 1);
        driverRepository.save(driver);

        return RatingResponse.from(rating);
    }
}
