package com.ampacash.creatorhub;

import com.ampacash.creatorhub.dto.RegistrationRequest;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class PasswordValidationTests {
    @Test void registrationEnforcesUtf8BcryptLimitAndDoesNotLogPasswords() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            var valid = new RegistrationRequest("Creator", "creator@example.com", "correct horse battery staple");
            assertThat(validator.validate(valid)).isEmpty();
            assertThat(valid.toString()).doesNotContain(valid.password());
            assertThat(validator.validate(new RegistrationRequest("Creator", "creator@example.com", "short"))).isNotEmpty();
            assertThat(validator.validate(new RegistrationRequest("Creator", "creator@example.com", "é".repeat(37)))).isNotEmpty();
            assertThat(validator.validate(new RegistrationRequest("Creator", "creator@example.com", "é".repeat(36)))).isEmpty();
        }
    }
}
