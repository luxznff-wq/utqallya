package com.utqallya.backend.service.impl;

import com.utqallya.backend.config.AppProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DirectionsServiceImplTest {

    @Test
    void decodesGoogleReferencePolyline() {
        var points = DirectionsServiceImpl.decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");

        assertThat(points).hasSize(3);
        assertThat(points.get(0).latitude()).isEqualTo(38.5);
        assertThat(points.get(0).longitude()).isEqualTo(-120.2);
        assertThat(points.get(2).latitude()).isEqualTo(43.252);
        assertThat(points.get(2).longitude()).isEqualTo(-126.453);
    }

    @Test
    void returnsStraightLineWhenDirectionsIsDisabled() {
        AppProperties properties = new AppProperties();
        properties.getDirections().setEnabled(false);
        properties.getTrip().setAverageSpeedKmh(30);
        DirectionsServiceImpl service = new DirectionsServiceImpl(properties);

        var route = service.getRoute(-15.4419, -74.6170, -15.4519, -74.6170);

        assertThat(route.distanceKm()).isEqualTo(1.11);
        assertThat(route.durationMinutes()).isEqualTo(3);
        assertThat(route.polyline()).hasSize(2);
        assertThat(route.polyline().get(0).latitude()).isEqualTo(-15.4419);
        assertThat(route.polyline().get(1).latitude()).isEqualTo(-15.4519);
    }
}
