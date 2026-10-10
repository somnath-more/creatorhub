package com.ampacash.creatorhub.dto;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonProperty;
public record ResetPasswordRequest(
        @NotBlank @Pattern(regexp="[A-Za-z0-9_-]{43}") @JsonProperty(access=JsonProperty.Access.WRITE_ONLY) String token,
        @NotBlank @Size(min=12,max=72) @Utf8Password @JsonProperty(access=JsonProperty.Access.WRITE_ONLY) String password) {
    @Override public String toString() { return "ResetPasswordRequest[redacted]"; }
}
