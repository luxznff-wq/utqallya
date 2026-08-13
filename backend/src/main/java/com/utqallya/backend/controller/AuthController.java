package com.utqallya.backend.controller;

import com.utqallya.backend.dto.request.LoginRequest;
import com.utqallya.backend.dto.request.ForgotPasswordRequest;
import com.utqallya.backend.dto.request.ResetPasswordRequest;
import com.utqallya.backend.dto.request.RegisterDriverRequest;
import com.utqallya.backend.dto.request.RegisterPassengerRequest;
import com.utqallya.backend.dto.response.AuthResponse;
import com.utqallya.backend.service.AuthService;
import com.utqallya.backend.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Registro e inicio de sesión. Estos endpoints son públicos (ver {@code SecurityConfig}).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register/passenger")
    public ResponseEntity<AuthResponse> registerPassenger(@Valid @RequestBody RegisterPassengerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerPassenger(request));
    }

    /**
     * Registro de conductor: multipart/form-data con una parte JSON ("data")
     * y cuatro archivos de imagen (DNI, licencia, SOAT y foto del vehículo).
     */
    @PostMapping(value = "/register/driver", consumes = "multipart/form-data")
    public ResponseEntity<AuthResponse> registerDriver(
            @Valid @RequestPart("data") RegisterDriverRequest request,
            @RequestPart("dniPhoto") MultipartFile dniPhoto,
            @RequestPart("licensePhoto") MultipartFile licensePhoto,
            @RequestPart("soatPhoto") MultipartFile soatPhoto,
            @RequestPart("vehiclePhoto") MultipartFile vehiclePhoto) {

        AuthResponse response = authService.registerDriver(request, dniPhoto, licensePhoto, soatPhoto, vehiclePhoto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }
}
