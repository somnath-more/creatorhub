package com.ampacash.creatorhub.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.*;

@Configuration
@PropertySource("classpath:openapi-defaults.properties")
public class OpenApiConfig {
    @Bean OpenAPI creatorHubOpenApi() {
        return new OpenAPI().info(new Info().title("CreatorHub API").version("v1")
                .description("Register, call GET /api/auth/csrf, then log in. Cookie writes require X-XSRF-TOKEN. Use Authorize with the access token for /api/me. Logout revokes the current session."))
                .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
