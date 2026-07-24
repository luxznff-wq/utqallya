package com.utqallya.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.IOException;

/**
 * Inicializa Firebase Admin SDK (usado para enviar notificaciones push vía FCM)
 * únicamente si {@code utqallya.firebase.enabled=true} y el archivo de
 * credenciales existe. Esto permite correr el backend en local sin Firebase.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FirebaseConfig {

    private final AppProperties appProperties;

    @PostConstruct
    public void init() {
        if (!appProperties.getFirebase().isEnabled()) {
            log.info("Firebase Cloud Messaging deshabilitado (utqallya.firebase.enabled=false)");
            return;
        }
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FileInputStream serviceAccount = new FileInputStream(appProperties.getFirebase().getCredentialsFile());
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Firebase Cloud Messaging inicializado correctamente");
            }
        } catch (IOException ex) {
            log.error("No se pudo inicializar Firebase con el archivo de credenciales configurado", ex);
        }
    }
}
