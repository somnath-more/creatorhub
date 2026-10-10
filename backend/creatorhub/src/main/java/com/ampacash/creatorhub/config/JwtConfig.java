package com.ampacash.creatorhub.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.ampacash.creatorhub.service.SessionService;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import javax.crypto.spec.SecretKeySpec;
import java.time.*;
import java.util.*;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {
    @Bean public Clock clock() { return Clock.systemUTC(); }
    @Bean public JwtEncoder jwtEncoder(JwtProperties properties) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key(properties)));
    }
    @Bean public JwtDecoder jwtDecoder(JwtProperties properties, Clock clock, SessionService sessions) {
        var decoder = NimbusJwtDecoder.withSecretKey(new SecretKeySpec(key(properties), "HmacSHA256"))
                .macAlgorithm(MacAlgorithm.HS256).build();
        var timestamps = new JwtTimestampValidator(Duration.ofSeconds(30));
        timestamps.setClock(clock);
        OAuth2TokenValidator<Jwt> required = jwt -> {
            try {
                UUID userId = UUID.fromString(jwt.getSubject());
                UUID sessionId = UUID.fromString(jwt.getClaimAsString("sid"));
                if (jwt.getExpiresAt() == null || jwt.getIssuedAt() == null
                        || !jwt.getAudience().contains(properties.audience())
                        || jwt.getIssuedAt().isAfter(clock.instant().plusSeconds(30))
                        || !jwt.getExpiresAt().isAfter(jwt.getIssuedAt())
                        || Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt()).getSeconds() > 900)
                    return invalid();
                if (!sessions.isActive(sessionId, userId)) return invalid();
                return OAuth2TokenValidatorResult.success();
            } catch (RuntimeException exception) { return invalid(); }
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(timestamps, new JwtIssuerValidator(properties.issuer()), required));
        return decoder;
    }
    private static OAuth2TokenValidatorResult invalid() {
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Required token claims are invalid.", null));
    }
    private byte[] key(JwtProperties properties) {
        try {
            byte[] bytes = Base64.getDecoder().decode(properties.secret());
            if (bytes.length < 32) throw new IllegalArgumentException();
            return bytes;
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("APP_JWT_SECRET must be Base64 encoding at least 32 random bytes.");
        }
    }
}
