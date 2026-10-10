package com.ampacash.creatorhub.controller;

import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.service.AccountRecoveryService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.UUID;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
public class AccountRecoveryController {
    private final AccountRecoveryService recovery;
    public AccountRecoveryController(AccountRecoveryService recovery) { this.recovery = recovery; }
    @PostMapping("/api/auth/forgot-password")
    public ResponseEntity<Map<String, String>> forgot(@Valid @RequestBody RecoveryEmailRequest request) {
        recovery.requestReset(request.email());
        return accepted();
    }
    @PostMapping("/api/account/email-verification/resend")
    @Operation(summary = "Resend your email verification link", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, String>> resend(@AuthenticationPrincipal Jwt jwt) {
        recovery.requestVerification(UUID.fromString(jwt.getSubject()));
        return accepted();
    }
    @PostMapping("/api/auth/reset-password")
    public ResponseEntity<Void> reset(@Valid @RequestBody ResetPasswordRequest request) {
        valid(recovery.resetPassword(request.token(), request.password()));
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }
    @PostMapping("/api/auth/verify-email")
    public ResponseEntity<Void> verify(@Valid @RequestBody ActionTokenRequest request) {
        valid(recovery.verifyEmail(request.token()));
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }
    private void valid(boolean valid) {
        if (!valid) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This link is invalid or expired. Request a new link.");
    }
    private ResponseEntity<Map<String, String>> accepted() {
        return ResponseEntity.accepted().cacheControl(CacheControl.noStore())
            .body(Map.of("message", "If eligible, an email will be sent. Check your inbox and spam folder."));
    }
}
