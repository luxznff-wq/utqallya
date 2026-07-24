package com.utqallya.backend.repository;

import com.utqallya.backend.entity.GeoLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GeoLocationRepository extends JpaRepository<GeoLocation, UUID> {
}
