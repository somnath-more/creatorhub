package com.ampacash.creatorhub.dto;
import jakarta.validation.constraints.*;
import java.time.Instant;
public record PublicationRequest(@NotNull @PositiveOrZero Long version, boolean mediaReady, Instant scheduledAt) {}
