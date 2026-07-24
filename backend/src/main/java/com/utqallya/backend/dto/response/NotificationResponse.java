package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.Notification;
import com.utqallya.backend.entity.enums.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String body,
        UUID relatedTripId,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(), notification.getType(), notification.getTitle(),
                notification.getBody(), notification.getRelatedTripId(), notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
