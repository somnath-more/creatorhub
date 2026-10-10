package com.ampacash.creatorhub.dto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
public record VerificationRequest(@NotBlank @Pattern(regexp="IN_PROGRESS|SUBMITTED") String status,
    @NotNull @Min(1) @Max(4) Integer step, @NotNull @Valid Personal personal,
    @NotNull @Pattern(regexp="|PASSPORT|NATIONAL_ID|DRIVING_LICENSE") String documentType,
    boolean documentSelected, boolean selfieSelected) {
    public record Personal(@NotNull @Size(max=100) String fullName,@NotNull @Size(max=10) String dateOfBirth,@NotNull @Size(max=80) String country) {
        @Override public String toString() { return "Personal[redacted]"; }
    }
    @Override public String toString() { return "VerificationRequest[redacted]"; }
}
