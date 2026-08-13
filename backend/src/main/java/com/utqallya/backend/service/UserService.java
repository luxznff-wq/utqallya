package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.ChangePasswordRequest;
import com.utqallya.backend.dto.request.UpdateEmergencyContactRequest;
import com.utqallya.backend.dto.response.MyProfileResponse;
import com.utqallya.backend.entity.User;

public interface UserService {

    MyProfileResponse getProfile(User user);

    void registerPushToken(User user, String pushToken);

    void changePassword(User user, ChangePasswordRequest request);

    MyProfileResponse updateEmergencyContact(User user, UpdateEmergencyContactRequest request);

    void revokeSessions(User user);

    void deleteAccount(User user);
}
