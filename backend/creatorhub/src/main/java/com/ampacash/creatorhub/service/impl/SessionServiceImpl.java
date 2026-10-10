package com.ampacash.creatorhub.service.impl;

import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.model.*;
import com.ampacash.creatorhub.repository.*;
import com.ampacash.creatorhub.service.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Service
public class SessionServiceImpl implements SessionService {
    private final AuthSessionRepository sessions;
    private final RefreshTokenRepository refreshTokens;
    private final TokenService tokens;
    private final CreatorService profiles;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    public SessionServiceImpl(AuthSessionRepository sessions, RefreshTokenRepository refreshTokens,
                              TokenService tokens, CreatorService profiles, Clock clock) {
        this.sessions = sessions; this.refreshTokens = refreshTokens; this.tokens = tokens;
        this.profiles = profiles; this.clock = clock;
    }
    @Override @Transactional public SessionGrant start(UUID userId) {
        var session = sessions.saveAndFlush(new AuthSession(userId, clock.instant()));
        return grant(session);
    }
    @Override @Transactional public Optional<SessionGrant> rotate(String raw) {
        if (raw == null || raw.length() > 128) return Optional.empty();
        String hash = hash(raw);
        var reference = refreshTokens.findSessionIdByTokenHash(hash);
        if (reference.isEmpty()) return Optional.empty();
        var session = sessions.lockById(reference.get()).orElse(null);
        if (session == null || !session.active(clock.instant())) return Optional.empty();
        // Load the token entity only after the lock, so the persistence context
        // cannot retain a stale unconsumed entity while waiting for another refresh.
        var token = refreshTokens.findByTokenHash(hash).orElseThrow();
        if (!token.usable(clock.instant())) {
            session.revoke(clock.instant());
            return Optional.empty(); // return normally so revocation commits
        }
        token.consume(clock.instant());
        return Optional.of(grant(session));
    }
    @Override @Transactional public void logout(String raw) {
        if (raw == null || raw.length() > 128) return;
        refreshTokens.findByTokenHash(hash(raw)).flatMap(t -> sessions.lockById(t.getSessionId()))
                .ifPresent(s -> s.revoke(clock.instant()));
    }
    @Override @Transactional(readOnly = true) public boolean isActive(UUID sid, UUID userId) {
        return sessions.findById(sid).filter(s -> s.getUserId().equals(userId) && s.active(clock.instant())).isPresent();
    }
    private SessionGrant grant(AuthSession session) {
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokens.saveAndFlush(new RefreshToken(session.getId(), hash(raw), session.getExpiresAt()));
        var response = new TokenResponse(tokens.issue(session.getUserId(), session.getId()), "Bearer", 900,
                profiles.current(session.getUserId()));
        return new SessionGrant(response, raw, session.getExpiresAt());
    }
    private String hash(String raw) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException("SHA-256 unavailable", exception); }
    }
}
