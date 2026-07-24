package com.utqallya.backend;

import com.utqallya.backend.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Punto de entrada de la API de Utqallya.
 * <p>
 * Utqallya es una aplicación de transporte de pasajeros enfocada exclusivamente
 * en los distritos de Acarí y Bella Unión (provincia de Caravelí, Arequipa).
 */
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
@EnableScheduling
public class UtqallyaApplication {

    public static void main(String[] args) {
        SpringApplication.run(UtqallyaApplication.class, args);
    }
}
