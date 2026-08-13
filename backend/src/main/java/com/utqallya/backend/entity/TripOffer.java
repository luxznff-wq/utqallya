package com.utqallya.backend.entity;

import com.utqallya.backend.entity.enums.TripOfferStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "trip_offers", uniqueConstraints = @UniqueConstraint(columnNames = {"trip_id", "driver_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripOffer extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TripOfferStatus status = TripOfferStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private Integer revisionCount = 0;
}
