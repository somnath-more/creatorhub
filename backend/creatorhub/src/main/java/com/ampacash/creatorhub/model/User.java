package com.ampacash.creatorhub.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false, unique = true, length = 254) private String email;
    @Column(name = "full_name", nullable = false, length = 100) private String fullName;
    @Column(name = "password_hash", nullable = false, length = 255) private String passwordHash;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    protected User() {}
    public User(String email, String fullName, String passwordHash) {
        this.email = email; this.fullName = fullName; this.passwordHash = passwordHash;
    }
    @PrePersist void created() { createdAt = Instant.now(); }
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPasswordHash() { return passwordHash; }
}
