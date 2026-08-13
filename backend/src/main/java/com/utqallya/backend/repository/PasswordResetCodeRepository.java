package com.utqallya.backend.repository;

import com.utqallya.backend.entity.PasswordResetCode;
import com.utqallya.backend.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PasswordResetCode> findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(User user);
}
