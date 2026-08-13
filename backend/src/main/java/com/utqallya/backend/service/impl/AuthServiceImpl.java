package com.utqallya.backend.service.impl;

import com.utqallya.backend.config.AppProperties;
import com.utqallya.backend.dto.request.LoginRequest;
import com.utqallya.backend.dto.request.RegisterDriverRequest;
import com.utqallya.backend.dto.request.RegisterPassengerRequest;
import com.utqallya.backend.dto.response.AuthResponse;
import com.utqallya.backend.dto.response.UserResponse;
import com.utqallya.backend.entity.Driver;
import com.utqallya.backend.entity.Role;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.Vehicle;
import com.utqallya.backend.entity.enums.DriverApprovalStatus;
import com.utqallya.backend.entity.enums.DriverAvailability;
import com.utqallya.backend.entity.enums.RoleName;
import com.utqallya.backend.exception.ConflictException;
import com.utqallya.backend.exception.UnauthorizedException;
import com.utqallya.backend.repository.DriverRepository;
import com.utqallya.backend.repository.RoleRepository;
import com.utqallya.backend.repository.UserRepository;
import com.utqallya.backend.repository.VehicleRepository;
import com.utqallya.backend.security.JwtTokenProvider;
import com.utqallya.backend.security.UserPrincipal;
import com.utqallya.backend.service.AuthService;
import com.utqallya.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final FileStorageService fileStorageService;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public AuthResponse registerPassenger(RegisterPassengerRequest request) {
        validateUniqueEmailAndPhone(request.email(), request.phone());

        Role passengerRole = roleRepository.findByName(RoleName.PASSENGER)
                .orElseThrow(() -> new IllegalStateException("Rol PASSENGER no está sembrado en la base de datos"));

        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email().toLowerCase())
                .phone(request.phone())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(passengerRole)
                .blocked(false)
                .build();

        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse registerDriver(RegisterDriverRequest request,
                                        MultipartFile dniPhoto,
                                        MultipartFile licensePhoto,
                                        MultipartFile soatPhoto,
                                        MultipartFile vehiclePhoto) {
        validateUniqueEmailAndPhone(request.email(), request.phone());

        if (vehicleRepository.existsByPlate(request.plate().toUpperCase())) {
            throw new ConflictException("Ya existe un vehículo registrado con esa placa");
        }

        Role driverRole = roleRepository.findByName(RoleName.DRIVER)
                .orElseThrow(() -> new IllegalStateException("Rol DRIVER no está sembrado en la base de datos"));

        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email().toLowerCase())
                .phone(request.phone())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(driverRole)
                .blocked(false)
                .build();
        userRepository.save(user);

        Vehicle vehicle = Vehicle.builder()
                .type(request.vehicleType())
                .plate(request.plate().toUpperCase())
                .brand(request.vehicleBrand())
                .model(request.vehicleModel())
                .color(request.vehicleColor())
                .photoUrl(fileStorageService.upload(vehiclePhoto, "vehicles"))
                .build();
        vehicleRepository.save(vehicle);

        Driver driver = Driver.builder()
                .user(user)
                .vehicle(vehicle)
                .dniNumber(request.dniNumber())
                .dniPhotoUrl(fileStorageService.upload(dniPhoto, "drivers/dni"))
                .licensePhotoUrl(fileStorageService.upload(licensePhoto, "drivers/license"))
                .soatPhotoUrl(fileStorageService.upload(soatPhoto, "drivers/soat"))
                .licenseExpiresAt(request.licenseExpiresAt())
                .soatExpiresAt(request.soatExpiresAt())
                .approvalStatus(DriverApprovalStatus.PENDING)
                .availability(DriverAvailability.UNAVAILABLE)
                .ratingAverage(0.0)
                .totalTrips(0)
                .build();
        driverRepository.save(driver);

        return buildAuthResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password()));

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new UnauthorizedException("Credenciales inválidas"));

            return buildAuthResponse(user);
        } catch (DisabledException | org.springframework.security.authentication.LockedException ex) {
            throw new UnauthorizedException("Tu cuenta ha sido bloqueada. Contacta al administrador.");
        } catch (BadCredentialsException ex) {
            throw new UnauthorizedException("Correo o contraseña incorrectos");
        }
    }

    private void validateUniqueEmailAndPhone(String email, String phone) {
        if (userRepository.existsByEmail(email.toLowerCase())) {
            throw new ConflictException("Ya existe una cuenta registrada con ese correo");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new ConflictException("Ya existe una cuenta registrada con ese teléfono");
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtTokenProvider.generateToken(principal);
        return AuthResponse.of(token, appProperties.getJwt().getExpirationMinutes(), UserResponse.from(user));
    }
}
