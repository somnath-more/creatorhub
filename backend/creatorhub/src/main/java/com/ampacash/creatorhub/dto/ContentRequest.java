package com.ampacash.creatorhub.dto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
public record ContentRequest(@NotBlank @Size(max=120) String title, @NotBlank @Size(max=5000) String description,
        @NotNull @DecimalMin("0") @DecimalMax("99999999") @Digits(integer=8,fraction=0) java.math.BigDecimal priceCents, @PositiveOrZero Long version,
        @Valid MediaMetadata thumbnail, @Valid MediaMetadata video) {
    public ContentRequest { if(title!=null) title=title.trim(); if(description!=null) description=description.trim(); }
}
