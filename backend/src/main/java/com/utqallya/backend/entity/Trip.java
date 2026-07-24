package com.utqallya.backend.entity;

import com.utqallya.backend.entity.enums.TripStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Un viaje solicitado por un pasajero. Es el agregado principal del dominio:
 * concentra el ciclo de vida completo descrito en {@link TripStatus}.
 * <p>
 * El campo {@code version} habilita bloqueo optimista para que, cuando varios
 * conductores intenten aceptar el mismo viaje al mismo tiempo, solo el primero
 * en persistir su cambio tenga éxito (ver {@code TripServiceImpl#acceptTrip}).
 */
@Entity
@Table(name = "trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "passenger_id", nullable = false)
    private User passenger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "origin_location_id", nullable = false)
    private GeoLocation origin;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destination_location_id", nullable = false)
    private GeoLocation destination;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_method_id", nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    @Builder.Default
    private TripStatus status = TripStatus.REQUESTED;

    /** Código numérico (4-6 dígitos) que el pasajero dicta al conductor para iniciar el viaje. */
    @Column(nullable = false, length = 6)
    private String confirmationCode;

    @Column(nullable = false)
    private Double distanceKm;

    @Column(nullable = false)
    private Integer estimatedDurationMinutes;

    /** Tarifa estimada informada al pasajero antes de solicitar (sin tarifas dinámicas). */
    @Column(nullable = false)
    private Double fare;

    @Column(nullable = false)
    private Integer searchRadiusMeters;

    private Instant acceptedAt;
    private Instant driverArrivedAt;
    private Instant startedAt;
    private Instant finishedAt;
    private Instant cancelledAt;

    @Column(length = 255)
    private String cancelReason;

    /** Bloqueo optimista: evita que dos conductores "ganen" el mismo viaje en una condición de carrera. */
    @Version
    private Long version;
}
