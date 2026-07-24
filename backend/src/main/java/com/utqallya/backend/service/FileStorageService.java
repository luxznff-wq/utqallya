package com.utqallya.backend.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Abstracción de almacenamiento de archivos (fotos de DNI, licencia, SOAT y vehículo).
 * La implementación por defecto sube a Cloudinary; podría reemplazarse por
 * Supabase Storage sin tocar el resto de la aplicación (Dependency Inversion).
 */
public interface FileStorageService {

    /**
     * Sube un archivo a una carpeta lógica (p.ej. "drivers/dni") y devuelve la URL pública.
     */
    String upload(MultipartFile file, String folder);
}
