package com.utqallya.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Habilita el llenado automático de {@code createdAt}/{@code updatedAt}
 * definidos en {@link com.utqallya.backend.entity.BaseEntity}.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
