package com.ampacash.creatorhub.model;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "account_action_tokens")
public class AccountActionToken {
    public enum Purpose { RESET, VERIFY }
    @Id private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16) private Purpose purpose;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "consumed_at") private Instant consumedAt;
    protected AccountActionToken() {}
    public AccountActionToken(UUID userId, Purpose purpose, String hash, Instant now) {
        id = UUID.randomUUID(); this.userId = userId; this.purpose = purpose;
        tokenHash = hash; createdAt = now; expiresAt = now.plusSeconds(purpose == Purpose.RESET ? 1800 : 86400);
    }
    public UUID getUserId() { return userId; }
    public boolean usable(Purpose expected, Instant now) { return purpose == expected && consumedAt == null && expiresAt.isAfter(now); }
    public void consume(Instant now) { consumedAt = now; }
}
