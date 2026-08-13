package com.utqallya.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utqallya.backend.dto.response.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Protección local para los endpoints más sensibles. Para múltiples instancias
 * debe reemplazarse por un contador compartido en gateway/Redis.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestRateLimitFilter extends OncePerRequestFilter {

    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int AUTH_LIMIT = 10;
    private static final int CODE_LIMIT = 10;
    private static final int MAX_KEYS = 10_000;

    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public RequestRateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        int limit = limitFor(request);
        if (limit == 0) {
            chain.doFilter(request, response);
            return;
        }

        Instant now = Instant.now();
        if (counters.size() > MAX_KEYS) {
            counters.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
        }

        String key = clientAddress(request) + ":" + request.getRequestURI();
        WindowCounter counter = counters.compute(key, (ignored, current) ->
                current == null || current.expiresAt().isBefore(now)
                        ? new WindowCounter(new AtomicInteger(1), now.plus(WINDOW))
                        : increment(current));

        if (counter.count().get() > limit) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(WINDOW.toSeconds()));
            objectMapper.writeValue(response.getOutputStream(), ApiErrorResponse.of(
                    429, "Too Many Requests",
                    "Demasiados intentos. Espera un minuto antes de volver a intentar.",
                    request.getRequestURI()));
            return;
        }
        chain.doFilter(request, response);
    }

    private WindowCounter increment(WindowCounter counter) {
        counter.count().incrementAndGet();
        return counter;
    }

    private int limitFor(HttpServletRequest request) {
        if (!"POST".equals(request.getMethod())) {
            return 0;
        }
        String uri = request.getRequestURI();
        if (uri.equals("/api/auth/login") || uri.startsWith("/api/auth/register/")) {
            return AUTH_LIMIT;
        }
        if (uri.equals("/api/auth/password/forgot") || uri.equals("/api/auth/password/reset")) {
            return CODE_LIMIT;
        }
        if (uri.matches("^/api/trips/[^/]+/confirm-code$")) {
            return CODE_LIMIT;
        }
        return 0;
    }

    private String clientAddress(HttpServletRequest request) {
        // No se confía en X-Forwarded-For hasta configurar un proxy de confianza.
        return request.getRemoteAddr();
    }

    private record WindowCounter(AtomicInteger count, Instant expiresAt) {
    }
}
