package com.utqallya.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de negocio configurables sin tocar código (ver {@code application.yml},
 * prefijo {@code utqallya.*}). Centralizar estos valores evita "números mágicos"
 * repartidos por los servicios.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "utqallya")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Trip trip = new Trip();
    private final Cloudinary cloudinary = new Cloudinary();
    private final Firebase firebase = new Firebase();
    private final Cors cors = new Cors();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long expirationMinutes;
    }

    @Getter
    @Setter
    public static class Trip {
        /** Radio de búsqueda de conductores disponibles, en metros. */
        private int searchRadiusMeters;
        /** Longitud del código numérico de confirmación (4 a 6 dígitos). */
        private int confirmationCodeLength;
        private int driverResponseTimeoutSeconds;
        /** Tarifa fija (S/) que se cobra por el solo hecho de tomar el viaje. Sin tarifas dinámicas. */
        private double baseFare;
        /** Tarifa (S/) por cada kilómetro recorrido, sumada a la tarifa base. */
        private double farePerKm;
        /** Velocidad promedio asumida (km/h) para estimar la duración del viaje. */
        private double averageSpeedKmh;
    }

    @Getter
    @Setter
    public static class Cloudinary {
        private String cloudName;
        private String apiKey;
        private String apiSecret;
    }

    @Getter
    @Setter
    public static class Firebase {
        private String credentialsFile;
        private boolean enabled;
    }

    @Getter
    @Setter
    public static class Cors {
        private String allowedOrigins;
    }
}
