package com.ampacash.creatorhub.controller;

import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }
    @PostMapping("/register")
    @Operation(summary = "Register a creator account")
    public ResponseEntity<CreatorProfile> register(@Valid @RequestBody RegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(request));
    }
    @PostMapping("/login")
    @Operation(summary = "Log in and receive a 15-minute access token")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header(HttpHeaders.PRAGMA, "no-cache").body(auth.login(request));
    }
}
