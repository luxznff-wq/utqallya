package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.LoginRequest;
import com.utqallya.backend.dto.request.RegisterDriverRequest;
import com.utqallya.backend.dto.request.RegisterPassengerRequest;
import com.utqallya.backend.dto.response.AuthResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {

    AuthResponse registerPassenger(RegisterPassengerRequest request);

    AuthResponse registerDriver(RegisterDriverRequest request,
                                 MultipartFile dniPhoto,
                                 MultipartFile licensePhoto,
                                 MultipartFile soatPhoto,
                                 MultipartFile vehiclePhoto);

    AuthResponse login(LoginRequest request);
}
