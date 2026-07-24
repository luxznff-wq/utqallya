package com.utqallya.backend.repository;

import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.DriverLocation;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DriverLocationRepository extends JpaRepository<DriverLocation, UUID> {

    Optional<DriverLocation> findByDriver(Driver driver);

    Optional<DriverLocation> findByDriverId(UUID driverId);

    /**
     * Conductores candidatos a recibir una solicitud de viaje: aprobados y disponibles.
     * El filtrado final por radio de búsqueda se hace en memoria con {@code GeoUtils}
     * (ver {@code TripServiceImpl}), ya que la cantidad de conductores activos en
     * Acarí y Bella Unión es pequeña y no justifica una consulta geoespacial nativa.
     */
    List<DriverLocation> findByDriverApprovalStatusAndDriverAvailability(
            DriverApprovalStatus approvalStatus, DriverAvailability availability);
}
