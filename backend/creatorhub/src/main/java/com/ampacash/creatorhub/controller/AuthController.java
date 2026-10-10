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
    public AuthController(AuthService auth, SessionCookies cookies) { this.auth = auth; this.cookies = cookies; }
    @PostMapping("/register")
    @Operation(summary = "Register a creator account")
    public ResponseEntity<CreatorProfile> register(@Valid @RequestBody RegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(request));
    }
    @PostMapping("/login")
    @Operation(summary = "Log in with X-XSRF-TOKEN; receive access token and HttpOnly refresh cookie")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        var grant = auth.login(request);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.SET_COOKIE, cookies.issue(grant)).body(grant.response());
    }
}
