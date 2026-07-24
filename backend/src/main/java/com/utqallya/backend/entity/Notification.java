package com.utqallya.backend.entity;

import com.utqallya.backend.entity.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Notificación persistida para un usuario (además de enviarse por push vía FCM).
 * Permite mostrar una bandeja de notificaciones dentro de la app aunque el
 * dispositivo no haya recibido el push (offline, permisos, etc.).
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 300)
    private String body;

    /** Id del viaje relacionado (si aplica), para que la app navegue directo a la pantalla correspondiente. */
    private java.util.UUID relatedTripId;

    @Column(nullable = false)
    @Builder.Default
    private boolean read = false;
}
