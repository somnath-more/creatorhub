package com.ampacash.creatorhub.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "auth_sessions")
public class AuthSession {
    @Id private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "revoked_at") private Instant revokedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected AuthSession() {}
    public AuthSession(UUID userId, Instant now) {
        id = UUID.randomUUID(); this.userId = userId; createdAt = now;
        expiresAt = now.plusSeconds(7 * 24 * 3600);
    }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean active(Instant now) { return revokedAt == null && expiresAt.isAfter(now); }
    public void revoke(Instant now) { if (revokedAt == null) revokedAt = now; }
}
