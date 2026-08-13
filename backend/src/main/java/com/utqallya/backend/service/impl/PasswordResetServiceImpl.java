package com.utqallya.backend.service.impl;

import com.utqallya.backend.config.AppProperties;
import com.utqallya.backend.dto.request.ForgotPasswordRequest;
import com.utqallya.backend.dto.request.ResetPasswordRequest;
import com.utqallya.backend.entity.PasswordResetCode;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.repository.PasswordResetCodeRepository;
import com.utqallya.backend.repository.UserRepository;
import com.utqallya.backend.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String INVALID_CODE_MESSAGE = "El código es inválido o ha expirado";

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public void requestReset(ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        User user = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (user == null || user.isBlocked() || user.getDeletedAt() != null) {
            return;
        }

        codeRepository.findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(user)
                .ifPresent(previous -> {
                    previous.setUsedAt(Instant.now());
                    codeRepository.save(previous);
                });

        String plainCode = String.format(Locale.ROOT, "%06d", SECURE_RANDOM.nextInt(1_000_000));
        PasswordResetCode code = PasswordResetCode.builder()
                .user(user)
                .codeHash(hash(plainCode))
                .expiresAt(Instant.now().plus(
                        appProperties.getPasswordReset().getExpirationMinutes(), ChronoUnit.MINUTES))
                .build();
        codeRepository.save(code);

        if (appProperties.getPasswordReset().isMailEnabled()) {
            try {
                sendResetEmail(user, plainCode);
            } catch (MailException exception) {
                // La respuesta pública sigue siendo neutral y nunca registra el código ni el correo.
                log.error("No se pudo enviar un correo de recuperación de contraseña", exception);
            }
        }
    }

    @Override
    @Transactional(noRollbackFor = BadRequestException.class)
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(candidate -> !candidate.isBlocked() && candidate.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException(INVALID_CODE_MESSAGE));

        PasswordResetCode resetCode = codeRepository
                .findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new BadRequestException(INVALID_CODE_MESSAGE));

        int maxAttempts = appProperties.getPasswordReset().getMaxAttempts();
        if (resetCode.getExpiresAt().isBefore(Instant.now()) || resetCode.getAttempts() >= maxAttempts) {
            resetCode.setUsedAt(Instant.now());
            codeRepository.save(resetCode);
            throw new BadRequestException(INVALID_CODE_MESSAGE);
        }

        if (!MessageDigest.isEqual(
                resetCode.getCodeHash().getBytes(StandardCharsets.US_ASCII),
                hash(request.code()).getBytes(StandardCharsets.US_ASCII))) {
            resetCode.setAttempts(resetCode.getAttempts() + 1);
            if (resetCode.getAttempts() >= maxAttempts) {
                resetCode.setUsedAt(Instant.now());
            }
            codeRepository.save(resetCode);
            throw new BadRequestException(INVALID_CODE_MESSAGE);
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setSessionVersion(user.getSessionVersion() + 1);
        user.setPushToken(null);
        resetCode.setUsedAt(Instant.now());
        userRepository.save(user);
        codeRepository.save(resetCode);
    }

    private void sendResetEmail(User user, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(appProperties.getPasswordReset().getMailFrom());
        message.setTo(user.getEmail());
        message.setSubject("Código para recuperar tu contraseña de Utqallya");
        message.setText("Hola " + user.getFullName() + ",\n\nTu código de recuperación es: " + code
                + "\n\nCaduca en " + appProperties.getPasswordReset().getExpirationMinutes()
                + " minutos. Si no solicitaste este cambio, ignora este mensaje.");
        mailSender.send(message);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no está disponible", exception);
        }
    }
}
