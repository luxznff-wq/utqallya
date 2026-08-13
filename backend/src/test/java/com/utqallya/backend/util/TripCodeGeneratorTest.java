package com.utqallya.backend.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TripCodeGeneratorTest {

    @Test
    void generatesNumericCodeWithRequestedLength() {
        String code = TripCodeGenerator.generate(6);

        assertThat(code).matches("\\d{6}");
    }
}
