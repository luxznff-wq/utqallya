package com.utqallya.backend.entity;

import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Perfil extendido de un usuario con rol DRIVER: documentación requerida
 * para operar y estado de aprobación administrado por el panel admin.
 * Un conductor solo puede aceptar viajes cuando {@code approvalStatus == APPROVED}
 * y {@code availability == AVAILABLE}.
 */
@Entity
@Table(name = "drivers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @OneToOne
    @JoinColumn(name = "vehicle_id", unique = true)
    private Vehicle vehicle;

    @Column(nullable = false, length = 20)
    private String dniNumber;

    @Column(nullable = false)
    private String dniPhotoUrl;

    @Column(nullable = false)
    private String licensePhotoUrl;

    @Column(nullable = false)
    private String soatPhotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DriverApprovalStatus approvalStatus = DriverApprovalStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DriverAvailability availability = DriverAvailability.UNAVAILABLE;

    @Column(nullable = false)
    @Builder.Default
    private Double ratingAverage = 0.0;

    /** Cantidad de calificaciones recibidas; se usa para recalcular {@code ratingAverage} como promedio móvil. */
    @Column(nullable = false)
    @Builder.Default
    private Integer totalRatings = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalTrips = 0;

    /** Motivo registrado por el administrador cuando el estado es REJECTED. */
    @Column(length = 255)
    private String rejectionReason;
}
