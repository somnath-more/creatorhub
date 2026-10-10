package com.ampacash.creatorhub.config;

import com.ampacash.creatorhub.exception.ApiProblemWriter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.http.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.*;
import java.util.List;

@Configuration
@EnableConfigurationProperties(CorsProperties.class)
public class SecurityConfig {
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http, ApiProblemWriter problems,
                                                  @Qualifier("corsConfigurationSource") CorsConfigurationSource cors,
                                                  @Value("${springdoc.api-docs.enabled:false}") boolean docsEnabled,
                                                  @Value("${app.auth.cookie-secure:true}") boolean secureCookies) throws Exception {
        AuthenticationEntryPoint unauthorized = (request, response, error) -> {
            response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
            problems.write(request, response, HttpStatus.UNAUTHORIZED, "A valid Bearer token is required.");
        };
        AccessDeniedHandler denied = (request, response, error) -> {
            if (error instanceof org.springframework.security.web.csrf.CsrfException) {
                problems.write(request, response, HttpStatus.FORBIDDEN, "Your security token is missing or invalid. Reload and try again.");
                return;
            }
            response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer error=\"insufficient_scope\"");
            problems.write(request, response, HttpStatus.FORBIDDEN, "Access is denied.");
        };
        var csrfTokens = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokens.setCookieCustomizer(cookie -> cookie.secure(secureCookies).sameSite("Lax").path("/"));
        return http.cors(config -> config.configurationSource(cors))
                .csrf(config -> config.spa().csrfTokenRepository(csrfTokens)
                        .requireCsrfProtectionMatcher(request -> "POST".equals(request.getMethod())
                                && List.of("/api/auth/login", "/api/auth/refresh", "/api/auth/logout")
                                .contains(request.getRequestURI().substring(request.getContextPath().length()))))
                .formLogin(AbstractHttpConfigurer::disable).httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable).requestCache(AbstractHttpConfigurer::disable)
                .sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(config -> {
                    config.requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/liveness", "/actuator/health/readiness").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                            .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/refresh", "/api/auth/logout").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/me").hasAuthority("SCOPE_creator");
                    if (docsEnabled) config.requestMatchers(HttpMethod.GET, "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**").permitAll();
                    config.anyRequest().denyAll();
                })
                .oauth2ResourceServer(config -> config.jwt(Customizer.withDefaults())
                        .authenticationEntryPoint(unauthorized).accessDeniedHandler(denied))
                .exceptionHandling(config -> config
                        .authenticationEntryPoint(unauthorized).accessDeniedHandler(denied))
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
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-XSRF-TOKEN"));
        config.setAllowCredentials(true);
        config.setMaxAge(600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
