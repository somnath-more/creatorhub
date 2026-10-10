package com.ampacash.creatorhub.controller;

import com.ampacash.creatorhub.config.SessionCookies;
import com.ampacash.creatorhub.dto.TokenResponse;
import com.ampacash.creatorhub.exception.ApiException;
import com.ampacash.creatorhub.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.*;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth") @Tag(name = "Authentication")
public class SessionController {
    private final SessionService sessions;
    private final SessionCookies cookies;
    public SessionController(SessionService sessions, SessionCookies cookies) { this.sessions = sessions; this.cookies = cookies; }
    @GetMapping("/csrf") @Operation(summary = "Initialize CSRF cookie before login, refresh or logout")
    public ResponseEntity<Void> csrf(CsrfToken token) {
        token.getToken(); // materialize deferred cookie; raw token is read from the cookie
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).build();
    }
    @PostMapping("/refresh") @Operation(summary = "Rotate refresh cookie; requires X-XSRF-TOKEN header")
    public ResponseEntity<TokenResponse> refresh(@Parameter(hidden = true) @CookieValue(name = SessionCookies.NAME, required = false) String raw,
                                                HttpServletResponse response) {
        var grant = sessions.rotate(raw);
        if (grant.isEmpty()) {
            response.addHeader(HttpHeaders.SET_COOKIE, cookies.clear());
            response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Your session has expired. Please sign in again.");
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .header(HttpHeaders.SET_COOKIE, cookies.issue(grant.get())).body(grant.get().response());
    }
    @PostMapping("/logout") @Operation(summary = "Revoke current session; requires X-XSRF-TOKEN header")
    public ResponseEntity<Void> logout(@Parameter(hidden = true) @CookieValue(name = SessionCookies.NAME, required = false) String raw) {
        sessions.logout(raw);
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).header(HttpHeaders.SET_COOKIE, cookies.clear()).build();
    }
}
