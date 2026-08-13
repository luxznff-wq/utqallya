package com.utqallya.backend.repository;

import com.utqallya.backend.entity.Notification;
import com.utqallya.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.time.Instant;
import com.utqallya.backend.entity.enums.NotificationType;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    long countByUserAndReadFalse(User user);

    boolean existsByUserAndTypeAndCreatedAtAfter(User user, NotificationType type, Instant createdAfter);
}
