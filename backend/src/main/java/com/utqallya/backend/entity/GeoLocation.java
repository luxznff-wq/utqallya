package com.utqallya.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Punto geográfico inmutable usado como origen o destino de un {@link Trip}.
 * Se guarda como snapshot (no referencia a un catálogo de lugares) porque
 * el pasajero elige libremente cualquier punto del mapa dentro de la zona de cobertura.
 */
@Entity
@Table(name = "geo_locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoLocation extends BaseEntity {

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 255)
    private String address;
}
