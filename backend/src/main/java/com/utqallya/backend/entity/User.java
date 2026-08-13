package com.utqallya.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Usuario base de la plataforma. Tanto pasajeros como conductores y el
 * administrador comparten esta tabla; el rol determina qué información
 * adicional aplica (ver {@link Driver} para el detalle específico de conductores).
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(nullable = false)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /** Permite al administrador bloquear una cuenta sin eliminarla. */
    @Column(nullable = false)
    @Builder.Default
    private boolean blocked = false;

    /** Token del dispositivo (Firebase Cloud Messaging) para notificaciones push. */
    @Column(length = 255)
    private String pushToken;

    @Column(length = 120)
    private String emergencyContactName;

    @Column(length = 16)
    private String emergencyContactPhone;

    private Instant deletedAt;

    /** Se incrementa para invalidar inmediatamente todos los JWT emitidos anteriormente. */
    @Column(nullable = false)
    @Builder.Default
    private Integer sessionVersion = 0;
}
