package com.ampacash.creatorhub.dto;

import jakarta.validation.*;
import java.nio.charset.StandardCharsets;

public class Utf8PasswordValidator implements ConstraintValidator<Utf8Password, String> {
    @Override public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}
