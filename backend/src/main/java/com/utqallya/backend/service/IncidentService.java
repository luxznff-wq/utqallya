package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.CreateIncidentRequest;
import com.utqallya.backend.dto.request.UpdateIncidentRequest;
import com.utqallya.backend.dto.response.IncidentResponse;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.IncidentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface IncidentService {

    IncidentResponse create(User reporter, CreateIncidentRequest request);

    Page<IncidentResponse> getMine(User reporter, Pageable pageable);

    Page<IncidentResponse> getAll(IncidentStatus status, Pageable pageable);

    IncidentResponse update(UUID id, UpdateIncidentRequest request);
}
