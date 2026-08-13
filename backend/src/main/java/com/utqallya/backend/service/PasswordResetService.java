package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.ForgotPasswordRequest;
import com.utqallya.backend.dto.request.ResetPasswordRequest;

public interface PasswordResetService {

    void requestReset(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);
}
