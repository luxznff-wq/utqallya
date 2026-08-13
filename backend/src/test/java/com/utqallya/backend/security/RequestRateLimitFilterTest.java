package com.utqallya.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RequestRateLimitFilterTest {

    @Test
    void blocksTheEleventhLoginAttemptFromTheSameAddress() throws Exception {
        RequestRateLimitFilter filter = new RequestRateLimitFilter(new ObjectMapper().findAndRegisterModules());
        FilterChain chain = mock(FilterChain.class);

        for (int attempt = 1; attempt <= 10; attempt++) {
            MockHttpServletResponse allowed = new MockHttpServletResponse();
            filter.doFilter(loginRequest(), allowed, chain);
            assertThat(allowed.getStatus()).isEqualTo(200);
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(loginRequest(), blocked, chain);

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isEqualTo("60");
        assertThat(blocked.getContentAsString()).contains("Demasiados intentos");
    }

    private MockHttpServletRequest loginRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("192.0.2.10");
        return request;
    }
}
