package com.ampacash.creatorhub;

import com.ampacash.creatorhub.config.CorsProperties;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class CorsPropertiesTests {
    @Test void exactOriginsAreValid() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertThat(factory.getValidator().validate(new CorsProperties(List.of("http://localhost:5173", "https://creator.example.com")))).isEmpty();
        }
    }
    @Test void wildcardPathsCredentialsAndEmptyListsAreInvalid() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            for (String origin : List.of("*", "https://*.example.com", "https://example.com/path", "https://user:password@example.com", "https://example.com?query=value", "null", "")) {
                assertThat(factory.getValidator().validate(new CorsProperties(List.of(origin)))).isNotEmpty();
            }
            assertThat(factory.getValidator().validate(new CorsProperties(List.of()))).isNotEmpty();
        }
    }
}
