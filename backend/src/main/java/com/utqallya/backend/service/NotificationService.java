package com.utqallya.backend.service;

import com.utqallya.backend.dto.response.NotificationResponse;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    /** Persiste la notificación y, si el usuario tiene un token registrado, la envía por FCM. */
    void notify(User user, NotificationType type, String title, String body, UUID relatedTripId);

    Page<NotificationResponse> getMyNotifications(User user, Pageable pageable);

    void markAsRead(User user, UUID notificationId);
}
