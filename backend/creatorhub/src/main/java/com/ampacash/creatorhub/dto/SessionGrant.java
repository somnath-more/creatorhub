package com.ampacash.creatorhub.dto;
import java.time.Instant;
/** Internal service result: never serialize the raw refresh token into API JSON. */
public record SessionGrant(TokenResponse response, String refreshToken, Instant expiresAt) {
    @Override public String toString() { return "SessionGrant[redacted]"; }
}
