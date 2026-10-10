package com.ampacash.creatorhub.dto;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonProperty;
public record ActionTokenRequest(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{43}") @JsonProperty(access=JsonProperty.Access.WRITE_ONLY) String token) {
    @Override public String toString() { return "ActionTokenRequest[redacted]"; }
}
