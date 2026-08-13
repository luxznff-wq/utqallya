package com.utqallya.backend.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GeoUtilsTest {

    @Test
    void distanceIsZeroForTheSamePoint() {
        assertThat(GeoUtils.distanceMeters(-15.4419, -74.6170, -15.4419, -74.6170))
                .isZero();
    }

    @Test
    void distanceIsSymmetricAndUsesMeters() {
        double outbound = GeoUtils.distanceMeters(-15.4419, -74.6170, -15.4519, -74.6170);
        double inbound = GeoUtils.distanceMeters(-15.4519, -74.6170, -15.4419, -74.6170);

        assertThat(outbound).isBetween(1_100.0, 1_120.0);
        assertThat(inbound).isEqualTo(outbound);
    }

    @Test
    void distanceInKilometersIsRoundedToTwoDecimals() {
        assertThat(GeoUtils.distanceKm(-15.4419, -74.6170, -15.4519, -74.6170))
                .isEqualTo(1.11);
    }

    @Test
    void etaRoundsUpAndNeverReturnsLessThanOneMinute() {
        assertThat(GeoUtils.estimateDurationMinutes(10, 30)).isEqualTo(20);
        assertThat(GeoUtils.estimateDurationMinutes(0, 30)).isEqualTo(1);
        assertThat(GeoUtils.estimateDurationMinutes(1.01, 60)).isEqualTo(2);
    }
}
