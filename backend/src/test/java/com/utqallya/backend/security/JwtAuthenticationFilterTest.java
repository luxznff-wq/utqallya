package com.utqallya.backend.security;

import com.utqallya.backend.entity.Role;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.entity.enums.RoleName;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private final JwtTokenProvider tokenProvider = mock(JwtTokenProvider.class);
    private final CustomUserDetailsService userDetailsService = mock(CustomUserDetailsService.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(tokenProvider, userDetailsService);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsTokenIssuedBeforeSessionRevocation() throws Exception {
        UUID userId = UUID.randomUUID();
        when(tokenProvider.isTokenValid("old-token")).thenReturn(true);
        when(tokenProvider.getUserId("old-token")).thenReturn(userId);
        when(tokenProvider.getSessionVersion("old-token")).thenReturn(1);
        when(userDetailsService.loadUserById(userId)).thenReturn(new UserPrincipal(user(userId, 2, false)));

        execute("old-token");

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void blockedUserIsNotAuthenticatedEvenWithValidToken() throws Exception {
        UUID userId = UUID.randomUUID();
        when(tokenProvider.isTokenValid("valid-token")).thenReturn(true);
        when(tokenProvider.getUserId("valid-token")).thenReturn(userId);
        when(userDetailsService.loadUserById(userId)).thenReturn(new UserPrincipal(user(userId, 0, true)));

        execute("valid-token");

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void authenticatesCurrentTokenForActiveUser() throws Exception {
        UUID userId = UUID.randomUUID();
        when(tokenProvider.isTokenValid("current-token")).thenReturn(true);
        when(tokenProvider.getUserId("current-token")).thenReturn(userId);
        when(tokenProvider.getSessionVersion("current-token")).thenReturn(3);
        when(userDetailsService.loadUserById(userId)).thenReturn(new UserPrincipal(user(userId, 3, false)));

        execute("current-token");

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }

    private void execute(String token) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
    }

    private User user(UUID id, int sessionVersion, boolean blocked) {
        User user = User.builder().email("user@example.com").passwordHash("hash")
                .role(new Role(RoleName.PASSENGER)).blocked(blocked)
                .sessionVersion(sessionVersion).build();
        user.setId(id);
        return user;
    }
}
