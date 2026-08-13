package com.utqallya.backend.controller;

import com.utqallya.backend.dto.request.ChangePasswordRequest;
import com.utqallya.backend.dto.request.RegisterDeviceTokenRequest;
import com.utqallya.backend.dto.request.UpdateEmergencyContactRequest;
import com.utqallya.backend.dto.response.MyProfileResponse;
import com.utqallya.backend.security.CurrentUserResolver;
import com.utqallya.backend.security.UserPrincipal;
import com.utqallya.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
    public ResponseEntity<MyProfileResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getProfile(currentUserResolver.resolve(principal)));
    }

    @PatchMapping("/me/push-token")
    public ResponseEntity<Void> registerPushToken(@AuthenticationPrincipal UserPrincipal principal,
                                                    @Valid @RequestBody RegisterDeviceTokenRequest request) {
        userService.registerPushToken(currentUserResolver.resolve(principal), request.pushToken());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me/push-token")
    public ResponseEntity<Void> removePushToken(@AuthenticationPrincipal UserPrincipal principal) {
        userService.registerPushToken(currentUserResolver.resolve(principal), null);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                                @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUserResolver.resolve(principal), request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/me/emergency-contact")
    public ResponseEntity<MyProfileResponse> updateEmergencyContact(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateEmergencyContactRequest request) {
        return ResponseEntity.ok(userService.updateEmergencyContact(
                currentUserResolver.resolve(principal), request));
    }

    @PostMapping("/me/sessions/revoke")
    public ResponseEntity<Void> revokeSessions(@AuthenticationPrincipal UserPrincipal principal) {
        userService.revokeSessions(currentUserResolver.resolve(principal));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal UserPrincipal principal) {
        userService.deleteAccount(currentUserResolver.resolve(principal));
        return ResponseEntity.noContent().build();
    }
}
