package com.ampacash.creatorhub.dto;
public record TokenResponse(String accessToken, String tokenType, long expiresIn, CreatorProfile creator) {
    @Override public String toString() { return "TokenResponse[accessToken=REDACTED]"; }
}
