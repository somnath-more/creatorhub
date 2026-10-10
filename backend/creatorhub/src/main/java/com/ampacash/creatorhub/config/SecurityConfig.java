package com.ampacash.creatorhub.config;

import com.ampacash.creatorhub.exception.ApiProblemWriter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.http.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
import java.util.List;

@Configuration
@EnableConfigurationProperties(CorsProperties.class)
public class SecurityConfig {
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http, ApiProblemWriter problems,
                                                  @Qualifier("corsConfigurationSource") CorsConfigurationSource cors) throws Exception {
        return http.cors(config -> config.configurationSource(cors))
                // No cookie/session authentication or business writes exist in this foundation.
                // Revisit CSRF with the authentication transport in the next security milestone.
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable).httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable).requestCache(AbstractHttpConfigurer::disable)
                .sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(config -> config
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/liveness", "/actuator/health/readiness").permitAll()
                        .anyRequest().denyAll())
                .exceptionHandling(config -> config
                        .authenticationEntryPoint((request, response, error) -> problems.write(request, response, HttpStatus.UNAUTHORIZED, "Authentication is not configured for this endpoint."))
                        .accessDeniedHandler((request, response, error) -> problems.write(request, response, HttpStatus.FORBIDDEN, "Access is denied.")))
                .build();
    }

    @Bean UserDetailsService userDetailsService() {
        // Prevent Boot's generated development user; this store deliberately contains no accounts.
        return new InMemoryUserDetailsManager();
    }

    @Bean CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(properties.allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(false);
        config.setMaxAge(600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
