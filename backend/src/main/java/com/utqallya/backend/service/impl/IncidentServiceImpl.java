package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.request.CreateIncidentRequest;
import com.utqallya.backend.dto.request.UpdateIncidentRequest;
import com.utqallya.backend.dto.response.IncidentResponse;
import com.utqallya.backend.dto.response.UserResponse;
import com.utqallya.backend.entity.Incident;
import com.utqallya.backend.entity.Trip;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.IncidentStatus;
import com.utqallya.backend.entity.enums.NotificationType;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.IncidentRepository;
import com.utqallya.backend.repository.TripRepository;
import com.utqallya.backend.service.IncidentService;
import com.utqallya.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepository;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public IncidentResponse create(User reporter, CreateIncidentRequest request) {
        Trip trip = tripRepository.findById(request.tripId())
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado"));
        boolean isPassenger = trip.getPassenger().getId().equals(reporter.getId());
        boolean isDriver = trip.getDriver() != null
                && trip.getDriver().getUser().getId().equals(reporter.getId());
        if (!isPassenger && !isDriver) {
            throw new ResourceNotFoundException("Viaje no encontrado");
        }
        if (incidentRepository.findByTripIdAndReporter(trip.getId(), reporter).isPresent()) {
            throw new ConflictException("Ya reportaste un incidente para este viaje");
        }

        Incident incident = Incident.builder()
                .trip(trip)
                .reporter(reporter)
                .category(request.category())
                .description(request.description().trim())
                .build();
        return toResponse(incidentRepository.save(incident));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<IncidentResponse> getMine(User reporter, Pageable pageable) {
        return incidentRepository.findByReporterOrderByCreatedAtDesc(reporter, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<IncidentResponse> getAll(IncidentStatus status, Pageable pageable) {
        Page<Incident> incidents = status == null
                ? incidentRepository.findAllByOrderByCreatedAtDesc(pageable)
                : incidentRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return incidents.map(this::toResponse);
    }

    @Override
    @Transactional
    public IncidentResponse update(UUID id, UpdateIncidentRequest request) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incidente no encontrado"));
        if (incident.getStatus() == IncidentStatus.RESOLVED && request.status() != IncidentStatus.RESOLVED) {
            throw new BadRequestException("Un incidente resuelto no puede reabrirse");
        }
        incident.setStatus(request.status());
        incident.setAdminNote(request.adminNote() == null ? null : request.adminNote().trim());
        incident.setResolvedAt(request.status() == IncidentStatus.RESOLVED ? Instant.now() : null);
        Incident saved = incidentRepository.save(incident);
        String statusText = request.status() == IncidentStatus.RESOLVED ? "resuelto" : "puesto en revisión";
        notificationService.notify(incident.getReporter(), NotificationType.INCIDENT_UPDATED,
                "Actualización de tu reporte",
                "Tu reporte de incidente fue " + statusText + ". Revisa el detalle en la app.",
                incident.getTrip().getId());
        return toResponse(saved);
    }

    private IncidentResponse toResponse(Incident incident) {
        User reporter = incident.getReporter();
        return new IncidentResponse(
                incident.getId(),
                incident.getTrip().getId(),
                UserResponse.from(reporter),
                incident.getCategory(),
                incident.getDescription(),
                incident.getStatus(),
                incident.getAdminNote(),
                incident.getCreatedAt(),
                incident.getResolvedAt());
    }
}
