package com.utqallya.backend.dto.request;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GeoPointRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsValidCoordinates() {
        assertThat(validator.validate(new GeoPointRequest(-15.4419, -74.6170, "Plaza de Acarí")))
                .isEmpty();
    }

    @Test
    void rejectsCoordinatesOutsideEarthBounds() {
        assertThat(validator.validate(new GeoPointRequest(91.0, -181.0, null)))
                .hasSize(2);
    }

    @Test
    void rejectsReferencesLongerThanDatabaseColumn() {
        assertThat(validator.validate(new GeoPointRequest(-15.4419, -74.6170, "x".repeat(256))))
                .hasSize(1);
    }
}
