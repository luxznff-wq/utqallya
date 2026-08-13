package com.utqallya.backend.service;

import com.utqallya.backend.dto.request.UpdateAvailabilityRequest;
import com.utqallya.backend.dto.request.UpdateDriverLocationRequest;
import com.utqallya.backend.dto.request.UpdateDriverDocumentsRequest;
import com.utqallya.backend.dto.request.UpdateDriverPaymentDetailsRequest;
import com.utqallya.backend.dto.response.DriverResponse;
import com.utqallya.backend.entity.User;
import org.springframework.web.multipart.MultipartFile;

public interface DriverService {

    DriverResponse getMyProfile(User user);

    DriverResponse updateAvailability(User user, UpdateAvailabilityRequest request);

    void updateLocation(User user, UpdateDriverLocationRequest request);

    DriverResponse updateDocuments(User user, UpdateDriverDocumentsRequest request,
                                   MultipartFile licensePhoto, MultipartFile soatPhoto);

    DriverResponse updatePaymentDetails(User user, UpdateDriverPaymentDetailsRequest request);
}
