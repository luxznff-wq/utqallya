package com.utqallya.backend.service.impl;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification.Builder;
import com.utqallya.backend.config.AppProperties;
import com.utqallya.backend.dto.response.NotificationResponse;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.NotificationType;
import com.utqallya.backend.exception.ResourceNotFoundException;
import com.utqallya.backend.repository.NotificationRepository;
import com.utqallya.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Envía notificaciones push mediante Firebase Cloud Messaging y las persiste
 * en la tabla {@code notifications} para poder mostrarlas dentro de la app
 * aunque el push no llegue (dispositivo apagado, sin permisos, etc.).
 * <p>
 * Si Firebase no está configurado ({@code utqallya.firebase.enabled=false}),
 * la notificación solo se persiste; esto permite levantar el backend en
 * desarrollo sin credenciales de Firebase.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FcmNotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public void notify(User user, NotificationType type, String title, String body, UUID relatedTripId) {
        var notification = com.utqallya.backend.entity.Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .relatedTripId(relatedTripId)
                .build();
        notificationRepository.save(notification);

        if (appProperties.getFirebase().isEnabled() && user.getPushToken() != null) {
            sendPush(user.getPushToken(), title, body, relatedTripId);
        }
    }

    private void sendPush(String pushToken, String title, String body, UUID relatedTripId) {
        try {
            Message.Builder message = Message.builder()
                    .setToken(pushToken)
                    .setNotification(new Builder().setTitle(title).setBody(body).build());

            if (relatedTripId != null) {
                message.putData("tripId", relatedTripId.toString());
            }

            FirebaseMessaging.getInstance().send(message.build());
        } catch (FirebaseMessagingException | IllegalStateException ex) {
            // Un fallo de push nunca debe romper el flujo de negocio (el viaje sigue su curso).
            log.warn("No se pudo enviar la notificación push: {}", ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(User user, Pageable pageable) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(NotificationResponse::from);
    }

    @Override
    @Transactional
    public void markAsRead(User user, UUID notificationId) {
        var notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Notificación no encontrada");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
