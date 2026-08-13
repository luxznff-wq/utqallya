package com.utqallya.backend.service.impl;

import com.utqallya.backend.config.AppProperties;
import com.utqallya.backend.dto.request.ForgotPasswordRequest;
import com.utqallya.backend.dto.request.ResetPasswordRequest;
import com.utqallya.backend.entity.PasswordResetCode;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.repository.PasswordResetCodeRepository;
import com.utqallya.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceImplTest {

    @Mock UserRepository userRepository;
    @Mock PasswordResetCodeRepository codeRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JavaMailSender mailSender;

    private PasswordResetServiceImpl service;
    private AppProperties properties;

    @BeforeEach
    void setUp() {
        properties = new AppProperties();
        properties.getPasswordReset().setExpirationMinutes(15);
        properties.getPasswordReset().setMaxAttempts(5);
        service = new PasswordResetServiceImpl(
                userRepository, codeRepository, passwordEncoder, mailSender, properties);
    }

    @Test
    void unknownEmailGetsNeutralTreatmentWithoutCreatingCode() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        service.requestReset(new ForgotPasswordRequest(" UNKNOWN@example.com "));

        verify(codeRepository, never()).save(any());
        verify(mailSender, never()).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    void validOneTimeCodeChangesPasswordAndIsConsumed() throws Exception {
        User user = User.builder().email("person@example.com").passwordHash("old").build();
        PasswordResetCode code = PasswordResetCode.builder()
                .user(user)
                .codeHash(sha256("123456"))
                .expiresAt(Instant.now().plusSeconds(600))
                .build();
        when(userRepository.findByEmail("person@example.com")).thenReturn(Optional.of(user));
        when(codeRepository.findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(user))
                .thenReturn(Optional.of(code));
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        service.resetPassword(new ResetPasswordRequest(
                "person@example.com", "123456", "new-password"));

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        assertThat(code.getUsedAt()).isNotNull();
        verify(userRepository).save(user);
        verify(codeRepository).save(code);
    }

    @Test
    void incorrectCodeIncrementsAttemptsAndKeepsGenericError() throws Exception {
        User user = User.builder().email("person@example.com").build();
        PasswordResetCode code = PasswordResetCode.builder()
                .user(user)
                .codeHash(sha256("123456"))
                .expiresAt(Instant.now().plusSeconds(600))
                .build();
        when(userRepository.findByEmail("person@example.com")).thenReturn(Optional.of(user));
        when(codeRepository.findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(user))
                .thenReturn(Optional.of(code));

        assertThatThrownBy(() -> service.resetPassword(
                new ResetPasswordRequest("person@example.com", "654321", "new-password")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("El código es inválido o ha expirado");

        assertThat(code.getAttempts()).isEqualTo(1);
        verify(codeRepository).save(code);
        verify(userRepository, never()).save(any());
    }

    private String sha256(String value) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
    }
}
