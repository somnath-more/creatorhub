package com.ampacash.creatorhub.config;

import com.ampacash.creatorhub.dto.SessionGrant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import java.time.*;

@Component
public class SessionCookies {
    public static final String NAME = "creatorhub-refresh";
    private final boolean secure;
    private final Clock clock;
    public SessionCookies(@Value("${app.auth.cookie-secure:true}") boolean secure, Clock clock) {
        this.secure = secure; this.clock = clock;
    }
    public String issue(SessionGrant grant) {
        return cookie(grant.refreshToken(), Math.max(0, Duration.between(clock.instant(), grant.expiresAt()).getSeconds()));
    }
    public String clear() { return cookie("", 0); }
    private String cookie(String value, long age) {
        return ResponseCookie.from(NAME, value).httpOnly(true).secure(secure).sameSite("Lax")
                .path("/api/auth").maxAge(age).build().toString();
    }
}
