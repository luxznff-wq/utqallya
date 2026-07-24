package com.utqallya.backend.service;

import com.utqallya.backend.dto.response.UserResponse;
import com.utqallya.backend.entity.User;

public interface UserService {

    UserResponse getProfile(User user);

    void registerPushToken(User user, String pushToken);
}
