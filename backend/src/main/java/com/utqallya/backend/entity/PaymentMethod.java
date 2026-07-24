package com.utqallya.backend.entity;

import com.utqallya.backend.entity.enums.PaymentMethodCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Catálogo de métodos de pago disponibles (efectivo, Yape). Modelado como
 * tabla de referencia para permitir agregar métodos a futuro sin migrar código.
 * No se integra ninguna pasarela: solo se registra la elección del pasajero.
 */
@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethod extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    private PaymentMethodCode code;

    @Column(nullable = false, length = 40)
    private String displayName;
}
