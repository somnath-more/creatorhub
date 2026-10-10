package com.ampacash.creatorhub.config;

import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import java.net.URI;
import java.util.List;

@Validated
@ConfigurationProperties("app.cors")
public record CorsProperties(@NotEmpty List<@NotBlank String> allowedOrigins) {
    @AssertTrue(message = "CORS origins must be exact HTTP(S) origins without wildcards, paths, or credentials.")
    public boolean isExactOrigins() {
        if (allowedOrigins == null) return false;
        return allowedOrigins.stream().allMatch(origin -> {
            if (origin == null) return false;
            try {
                URI uri = URI.create(origin);
                return ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                        && uri.getHost() != null && !origin.contains("*") && uri.getUserInfo() == null
                        && uri.getRawQuery() == null && uri.getFragment() == null
                        && (uri.getPath() == null || uri.getPath().isEmpty());
            } catch (IllegalArgumentException exception) { return false; }
        });
    }
}
