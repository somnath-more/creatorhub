package com.ampacash.creatorhub.service.impl;

import com.ampacash.creatorhub.config.JwtProperties;
import com.ampacash.creatorhub.service.TokenService;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.util.*;

@Service
public class TokenServiceImpl implements TokenService {
    private final JwtEncoder encoder;
    private final JwtProperties properties;
    private final Clock clock;
    public TokenServiceImpl(JwtEncoder encoder, JwtProperties properties, Clock clock) {
        this.encoder = encoder; this.properties = properties; this.clock = clock;
    }
    @Override public String issue(UUID userId) {
        var now = clock.instant();
        var claims = JwtClaimsSet.builder().issuer(properties.issuer()).audience(List.of(properties.audience()))
                .subject(userId.toString()).issuedAt(now).notBefore(now).expiresAt(now.plusSeconds(900))
                .id(UUID.randomUUID().toString()).claim("scope", "creator").build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
