package com.utqallya.backend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.utqallya.backend.config.AppProperties;
import com.utqallya.backend.exception.BadRequestException;
import com.utqallya.backend.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Implementación de {@link FileStorageService} basada en Cloudinary.
 * Cada foto se sube como recurso público (necesario para que la app y el
 * panel admin puedan mostrarla) dentro de la carpeta lógica indicada.
 */
@Slf4j
@Service
public class CloudinaryFileStorageServiceImpl implements FileStorageService {

    private final Cloudinary cloudinary;

    public CloudinaryFileStorageServiceImpl(AppProperties appProperties) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", appProperties.getCloudinary().getCloudName(),
                "api_key", appProperties.getCloudinary().getApiKey(),
                "api_secret", appProperties.getCloudinary().getApiSecret(),
                "secure", true
        ));
    }

    @Override
    public String upload(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("El archivo '" + folder + "' es obligatorio");
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "utqallya/" + folder,
                    "resource_type", "image"
            ));
            return (String) result.get("secure_url");
        } catch (IOException ex) {
            log.error("Error subiendo archivo a Cloudinary (folder={})", folder, ex);
            throw new BadRequestException("No se pudo subir el archivo: " + folder);
        }
    }
}
