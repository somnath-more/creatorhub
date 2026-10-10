package com.ampacash.creatorhub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.util.Locale;

public record LoginRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 72) @Utf8Password
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
        @Schema(accessMode = Schema.AccessMode.WRITE_ONLY, format = "password") String password) {
    public LoginRequest { email = email == null ? null : email.trim().toLowerCase(Locale.ROOT); }
    @Override public String toString() { return "LoginRequest[password=REDACTED]"; }
}
