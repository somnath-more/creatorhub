package com.ampacash.creatorhub;

import com.ampacash.creatorhub.model.Creator;
import com.ampacash.creatorhub.repository.CreatorRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.postgresql.PostgreSQLContainer;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CreatorRepositoryIT extends DatabaseIntegrationTest {
    @Autowired CreatorRepository repository;
    @Autowired Flyway flyway;
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Test void migrationAndJpaMappingWorkOnPostgres() {
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("4");
        Creator creator = repository.saveAndFlush(new Creator("test:" + UUID.randomUUID()));
        Creator loaded = repository.findById(creator.getId()).orElseThrow();
        assertThat(loaded.getPrincipalReference()).isEqualTo(creator.getPrincipalReference());
        assertThat(loaded.getCreatedAt()).isNotNull();
        assertThat(loaded.getUpdatedAt()).isNotNull();
    }
    @Test void duplicatePrincipalsAreRejectedByDatabase() {
        String principal = "test:" + UUID.randomUUID();
        repository.saveAndFlush(new Creator(principal));
        assertThatThrownBy(() -> repository.saveAndFlush(new Creator(principal)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
    @Test void blankPrincipalIsRejectedByDatabase() {
        assertThatThrownBy(() -> jdbc.update("INSERT INTO creators(id, principal_reference) VALUES (?, ?)", UUID.randomUUID(), " "))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
    @Test void healthAndReadinessHideDependencyDetails() throws Exception {
        for (String path : new String[]{"/actuator/health", "/actuator/health/liveness", "/actuator/health/readiness"}) {
            mvc.perform(get(path)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("UP")).andExpect(jsonPath("$.components").doesNotExist());
        }
    }
}
