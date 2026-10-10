package com.ampacash.creatorhub.controller;

import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.service.AuthService;
import com.ampacash.creatorhub.config.SessionCookies;
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
    private final SessionCookies cookies;
    private final com.ampacash.creatorhub.service.AccountRecoveryService recovery;
    public AuthController(AuthService auth, SessionCookies cookies, com.ampacash.creatorhub.service.AccountRecoveryService recovery) { this.auth = auth; this.cookies = cookies; this.recovery = recovery; }
    @PostMapping("/register")
    @Operation(summary = "Register a creator account")
    public ResponseEntity<CreatorProfile> register(@Valid @RequestBody RegistrationRequest request) {
        var profile = auth.register(request);
        recovery.requestVerification(profile.userId());
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore()).body(profile);
    }
    @PostMapping("/login")
    @Operation(summary = "Log in with X-XSRF-TOKEN; receive access token and HttpOnly refresh cookie")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        var grant = auth.login(request);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.SET_COOKIE, cookies.issue(grant)).body(grant.response());
    }
}
