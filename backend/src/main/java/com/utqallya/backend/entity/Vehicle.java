package com.utqallya.backend.entity;

import com.utqallya.backend.entity.enums.VehicleType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Vehículo de un conductor. Solo se admiten automóviles y mototaxis
 * (sin camiones, buses, minivans ni vehículos de reparto).
 */
@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle extends BaseEntity {

    @OneToOne(mappedBy = "vehicle")
    private Driver driver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleType type;

    @Column(nullable = false, unique = true, length = 10)
    private String plate;

    @Column(length = 60)
    private String brand;

    @Column(length = 60)
    private String model;

    @Column(length = 30)
    private String color;

    @Column(nullable = false)
    private String photoUrl;
}
