package com.utqallya.backend.service.impl;

import com.utqallya.backend.entity.AdminAuditLog;
import com.utqallya.backend.entity.User;
import com.utqallya.backend.repository.AdminAuditLogRepository;
import com.utqallya.backend.security.RequestCorrelationFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.MDC;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AdminAuditServiceImplTest {

    private final AdminAuditLogRepository repository = mock(AdminAuditLogRepository.class);
    private final AdminAuditServiceImpl service = new AdminAuditServiceImpl(repository);

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void recordsActorTargetAndCorrelationWithoutSecrets() {
        User actor = User.builder().email("admin@example.com").build();
        actor.setId(UUID.randomUUID());
        UUID targetId = UUID.randomUUID();
        MDC.put(RequestCorrelationFilter.MDC_KEY, "request-123");

        service.record(actor, "USER_BLOCKED", "USER", targetId, null);

        ArgumentCaptor<AdminAuditLog> captor = ArgumentCaptor.forClass(AdminAuditLog.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getActor()).isSameAs(actor);
        assertThat(captor.getValue().getTargetId()).isEqualTo(targetId);
        assertThat(captor.getValue().getRequestId()).isEqualTo("request-123");
        assertThat(captor.getValue().getDetails()).isNull();
    }
}
