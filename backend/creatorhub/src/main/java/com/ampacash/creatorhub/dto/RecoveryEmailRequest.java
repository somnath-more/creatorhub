package com.ampacash.creatorhub.dto;
import jakarta.validation.constraints.*;
import java.util.Locale;
public record RecoveryEmailRequest(@NotBlank @Email @Size(max=254) String email) {
    public RecoveryEmailRequest { if(email != null) email = email.trim().toLowerCase(Locale.ROOT); }
}
