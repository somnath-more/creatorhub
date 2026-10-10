package com.ampacash.creatorhub.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "creators")
public class Creator {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "principal_reference", nullable = false, unique = true, length = 255, updatable = false)
    private String principalReference;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Creator() {}
    public Creator(String principalReference) {
        if (principalReference == null || principalReference.isBlank() || principalReference.length() > 255)
            throw new IllegalArgumentException("Principal reference must contain 1 to 255 characters.");
        this.principalReference = principalReference;
    }
    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public String getPrincipalReference() { return principalReference; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
