package com.utqallya.backend.service.impl;

import com.utqallya.backend.dto.response.UserResponse;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.repository.UserRepository;
import com.utqallya.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserResponse getProfile(User user) {
        return UserResponse.from(user);
    }

    @Override
    @Transactional
    public void registerPushToken(User user, String pushToken) {
        user.setPushToken(pushToken);
        userRepository.save(user);
    }
}
