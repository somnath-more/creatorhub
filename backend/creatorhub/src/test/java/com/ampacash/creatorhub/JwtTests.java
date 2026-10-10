package com.ampacash.creatorhub;

import com.ampacash.creatorhub.config.JwtConfig;
import com.ampacash.creatorhub.config.JwtProperties;
import com.ampacash.creatorhub.service.impl.TokenServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class JwtTests {
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-10T00:00:00Z"), ZoneOffset.UTC);
    private final JwtProperties properties = new JwtProperties(Base64.getEncoder().encodeToString("test-only-key-with-at-least-32-random-bytes".getBytes()), "creatorhub", "creatorhub-api");
    private final JwtConfig config = new JwtConfig();
    private final JwtEncoder encoder = config.jwtEncoder(properties);
    private final JwtDecoder decoder = config.jwtDecoder(properties, clock, sessions());

    private com.ampacash.creatorhub.service.SessionService sessions() { var sessions = org.mockito.Mockito.mock(com.ampacash.creatorhub.service.SessionService.class); org.mockito.Mockito.when(sessions.isActive(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(true); return sessions; }
    @Test void issuedTokensIdentifyUserAndExpireAfterFifteenMinutes() {
        UUID id = UUID.randomUUID();
        String token = new TokenServiceImpl(encoder, properties, clock).issue(id, UUID.randomUUID());
        Jwt jwt = decoder.decode(token);
        assertThat(jwt.getSubject()).isEqualTo(id.toString());
        assertThat(jwt.getAudience()).containsExactly("creatorhub-api");
        assertThat(jwt.getClaimAsString("scope")).isEqualTo("creator");
        assertThat(Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt())).isEqualTo(Duration.ofMinutes(15));
        assertThat(jwt.getId()).isNotBlank();
    }
    @Test void wrongIssuerAudienceExpiredAndMissingExpiryAreRejected() {
        for (String problem : List.of("issuer", "audience", "expired", "expiry", "subject")) {
            var claims = JwtClaimsSet.builder().subject(problem.equals("subject") ? "invalid" : UUID.randomUUID().toString())
                    .claim("sid", UUID.randomUUID().toString()).issuer(problem.equals("issuer") ? "other" : "creatorhub")
                    .audience(List.of(problem.equals("audience") ? "other" : "creatorhub-api"))
                    .issuedAt(clock.instant().minusSeconds(problem.equals("expired") ? 900 : 0));
            if (!problem.equals("expiry")) claims.expiresAt(clock.instant().plusSeconds(problem.equals("expired") ? -60 : 600));
            String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims.build())).getTokenValue();
            assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
        }
    }
    @Test void tamperedAndWrongKeyTokensAreRejected() {
        String token = new TokenServiceImpl(encoder, properties, clock).issue(UUID.randomUUID(), UUID.randomUUID());
        String[] parts = token.split("\\.");
        String tampered = parts[0] + "." + Base64.getUrlEncoder().withoutPadding().encodeToString("{}".getBytes()) + "." + parts[2];
        assertThatThrownBy(() -> decoder.decode(tampered)).isInstanceOf(JwtException.class);
        var other = new JwtProperties(Base64.getEncoder().encodeToString("different-test-key-with-at-least-32-bytes".getBytes()), "creatorhub", "creatorhub-api");
        String otherToken = new TokenServiceImpl(config.jwtEncoder(other), other, clock).issue(UUID.randomUUID(), UUID.randomUUID());
        assertThatThrownBy(() -> decoder.decode(otherToken)).isInstanceOf(JwtException.class);
    }
    @Test void weakSigningKeysFailConfiguration() {
        assertThatThrownBy(() -> config.jwtEncoder(new JwtProperties("not-base64", "creatorhub", "creatorhub-api"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> config.jwtEncoder(new JwtProperties(Base64.getEncoder().encodeToString("short".getBytes()), "creatorhub", "creatorhub-api"))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void unsupportedAlgorithmAndMissingOrFutureIssuedAtAreRejected() {
        String token = new TokenServiceImpl(encoder, properties, clock).issue(UUID.randomUUID(), UUID.randomUUID());
        String[] parts = token.split("\\.");
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"HS512\"}".getBytes());
        assertThatThrownBy(() -> decoder.decode(header + "." + parts[1] + "." + parts[2])).isInstanceOf(JwtException.class);
        for (Instant issuedAt : Arrays.asList(null, clock.instant().plusSeconds(60))) {
            var claims = JwtClaimsSet.builder().subject(UUID.randomUUID().toString()).claim("sid", UUID.randomUUID().toString()).issuer("creatorhub")
                    .audience(List.of("creatorhub-api")).expiresAt(clock.instant().plusSeconds(900));
            if (issuedAt != null) claims.issuedAt(issuedAt);
            String invalid = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims.build())).getTokenValue();
            assertThatThrownBy(() -> decoder.decode(invalid)).isInstanceOf(JwtException.class);
        }
    }
}
