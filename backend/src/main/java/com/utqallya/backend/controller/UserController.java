package com.utqallya.backend.controller;

import com.utqallya.backend.dto.request.RegisterDeviceTokenRequest;
import com.utqallya.backend.dto.response.UserResponse;
import com.utqallya.backend.security.CurrentUserResolver;
import com.utqallya.backend.security.UserPrincipal;
import com.utqallya.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Perfil del usuario autenticado (pasajero, conductor o admin). */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getProfile(currentUserResolver.resolve(principal)));
    }

    @PatchMapping("/me/push-token")
    public ResponseEntity<Void> registerPushToken(@AuthenticationPrincipal UserPrincipal principal,
                                                    @Valid @RequestBody RegisterDeviceTokenRequest request) {
        userService.registerPushToken(currentUserResolver.resolve(principal), request.pushToken());
        return ResponseEntity.noContent().build();
    }
}
