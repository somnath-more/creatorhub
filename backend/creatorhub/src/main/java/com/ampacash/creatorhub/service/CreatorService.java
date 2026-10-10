package com.ampacash.creatorhub.service;
import com.ampacash.creatorhub.dto.CreatorProfile;
import java.util.UUID;
public interface CreatorService { CreatorProfile current(UUID userId); }
