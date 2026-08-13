package com.utqallya.backend.repository;

import com.utqallya.backend.entity.Incident;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.IncidentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    Page<Incident> findByReporterOrderByCreatedAtDesc(User reporter, Pageable pageable);

    Page<Incident> findByStatusOrderByCreatedAtDesc(IncidentStatus status, Pageable pageable);

    Page<Incident> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<Incident> findByTripIdAndReporter(UUID tripId, User reporter);
}
