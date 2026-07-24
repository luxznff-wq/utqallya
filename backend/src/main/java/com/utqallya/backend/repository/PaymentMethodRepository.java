package com.utqallya.backend.repository;

import com.utqallya.backend.entity.PaymentMethod;
import com.utqallya.backend.entity.enums.PaymentMethodCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, UUID> {

    Optional<PaymentMethod> findByCode(PaymentMethodCode code);
}
