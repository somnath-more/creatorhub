package com.ampacash.creatorhub.dto;
import java.util.UUID;
public record CreatorProfile(UUID userId, UUID creatorId, String fullName, String email) {}
