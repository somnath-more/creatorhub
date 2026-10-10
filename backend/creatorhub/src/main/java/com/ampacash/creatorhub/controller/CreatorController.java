package com.ampacash.creatorhub.controller;

import com.ampacash.creatorhub.dto.CreatorProfile;
import com.ampacash.creatorhub.service.CreatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.UUID;

@RestController
@Tag(name = "Creator")
public class CreatorController {
    private final CreatorService creators;
    public CreatorController(CreatorService creators) { this.creators = creators; }
    @GetMapping("/api/me")
    @Operation(summary = "Get your creator profile", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<CreatorProfile> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(creators.current(UUID.fromString(jwt.getSubject())));
    }
}
