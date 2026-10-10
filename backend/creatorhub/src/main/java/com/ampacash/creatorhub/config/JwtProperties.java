package com.ampacash.creatorhub.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.jwt")
public record JwtProperties(@NotBlank String secret,
                            @DefaultValue("creatorhub") @NotBlank String issuer,
                            @DefaultValue("creatorhub-api") @NotBlank String audience) {}
