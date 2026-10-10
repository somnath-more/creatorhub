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
                .description("Register, log in, then use Authorize with your access token to call /api/me."))
                .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
