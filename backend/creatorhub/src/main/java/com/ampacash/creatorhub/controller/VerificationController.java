package com.ampacash.creatorhub.controller;
import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.service.VerificationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/api/verification")
@Tag(name="Identity verification (simulation)") @SecurityRequirement(name="bearerAuth")
public class VerificationController {
    private final VerificationService service;
    public VerificationController(VerificationService service) { this.service=service; }
    @GetMapping public ResponseEntity<VerificationResponse> load(@AuthenticationPrincipal Jwt jwt) { return ok(service.load(UUID.fromString(jwt.getSubject()))); }
    @PutMapping public ResponseEntity<VerificationResponse> save(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody VerificationRequest body) { return ok(service.save(UUID.fromString(jwt.getSubject()),body)); }
    @PostMapping("/demo-approval") public ResponseEntity<VerificationResponse> approve(@AuthenticationPrincipal Jwt jwt) { return ok(service.approveDemo(UUID.fromString(jwt.getSubject()))); }
    private <T> ResponseEntity<T> ok(T value) { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value); }
}
