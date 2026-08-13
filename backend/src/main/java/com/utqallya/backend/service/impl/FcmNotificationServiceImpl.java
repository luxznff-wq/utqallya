package com.utqallya.backend.service.impl;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
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
import org.springframework.web.client.RestClient;

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

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

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
            sendPush(user.getPushToken(), type, title, body, relatedTripId);
        }
    }

    private void sendPush(String pushToken, NotificationType type, String title, String body, UUID relatedTripId) {
        if (pushToken.startsWith("ExpoPushToken[") || pushToken.startsWith("ExponentPushToken[")) {
            sendExpoPush(pushToken, type, title, body, relatedTripId);
            return;
        }
        try {
            Message.Builder message = Message.builder()
                    .setToken(pushToken)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build());

            if (relatedTripId != null) {
                message.putData("tripId", relatedTripId.toString());
            }
            message.putData("notificationType", type.name());

            FirebaseMessaging.getInstance().send(message.build());
        } catch (FirebaseMessagingException | IllegalStateException ex) {
            // Un fallo de push nunca debe romper el flujo de negocio (el viaje sigue su curso).
            log.warn("No se pudo enviar la notificación push: {}", ex.getMessage());
        }
    }

    private void sendExpoPush(
            String pushToken, NotificationType type, String title, String body, UUID relatedTripId) {
        try {
            var payload = new java.util.HashMap<String, Object>();
            payload.put("to", pushToken);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            var data = new java.util.HashMap<String, String>();
            data.put("notificationType", type.name());
            if (relatedTripId != null) data.put("tripId", relatedTripId.toString());
            payload.put("data", data);
            RestClient.create().post()
                    .uri(EXPO_PUSH_URL)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RuntimeException ex) {
            log.warn("No se pudo enviar la notificación mediante Expo Push: {}", ex.getMessage());
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
