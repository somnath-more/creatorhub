package com.ampacash.creatorhub.dto;

import jakarta.validation.*;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = Utf8PasswordValidator.class)
public @interface Utf8Password {
    String message() default "Password must use at most 72 UTF-8 bytes.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
