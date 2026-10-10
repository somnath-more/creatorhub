package com.ampacash.creatorhub;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

abstract class DatabaseIntegrationTest {
    @org.springframework.test.context.bean.override.mockito.MockitoBean
    protected com.ampacash.creatorhub.service.AccountMailService accountMail;
    private static PostgreSQLContainer database;
    @DynamicPropertySource static synchronized void database(DynamicPropertyRegistry registry) {
        registry.add("app.publication.poll-ms", () -> 3600000);
        registry.add("app.auth.cookie-secure", () -> true);
        String external = System.getenv("TEST_DATABASE_URL");
        if (external != null && !external.isBlank()) {
            registry.add("spring.datasource.url", () -> external);
            registry.add("spring.datasource.username", () -> required("TEST_DATABASE_USERNAME"));
            registry.add("spring.datasource.password", () -> required("TEST_DATABASE_PASSWORD"));
        } else {
            if (database == null) { database = new PostgreSQLContainer("postgres:17-alpine"); database.start(); }
            registry.add("spring.datasource.url", database::getJdbcUrl);
            registry.add("spring.datasource.username", database::getUsername);
            registry.add("spring.datasource.password", database::getPassword);
        }
        registry.add("app.jwt.secret", () -> Base64.getEncoder().encodeToString("test-only-signing-key-with-at-least-32-bytes".getBytes(StandardCharsets.UTF_8)));
    }
    private static String required(String key) {
        String value = System.getenv(key);
        if (value == null) throw new IllegalStateException(key + " is required with TEST_DATABASE_URL");
        return value;
    }
}
