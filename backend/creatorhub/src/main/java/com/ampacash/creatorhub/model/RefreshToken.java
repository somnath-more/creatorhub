package com.ampacash.creatorhub.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "refresh_tokens")
public class RefreshToken {
    @Id private UUID id;
    @Column(name = "session_id", nullable = false) private UUID sessionId;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "consumed_at") private Instant consumedAt;
    protected RefreshToken() {}
    public RefreshToken(UUID sessionId, String hash, Instant expiry) {
        id = UUID.randomUUID(); this.sessionId = sessionId; tokenHash = hash; expiresAt = expiry;
    }
    public UUID getSessionId() { return sessionId; }
    public boolean usable(Instant now) { return consumedAt == null && expiresAt.isAfter(now); }
    public void consume(Instant now) { consumedAt = now; }
}
