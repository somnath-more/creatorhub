package com.ampacash.creatorhub.service.impl;

import com.ampacash.creatorhub.model.*;
import com.ampacash.creatorhub.model.AccountActionToken.Purpose;
import com.ampacash.creatorhub.repository.*;
import com.ampacash.creatorhub.service.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.slf4j.LoggerFactory;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Clock;
import java.util.*;

@Service
public class AccountRecoveryServiceImpl implements AccountRecoveryService {
    private final UserRepository users;
    private final AccountActionTokenRepository actions;
    private final AuthSessionRepository sessions;
    private final PasswordEncoder passwords;
    private final AccountMailService mail;
    private final Clock clock;
    private final String frontend;
    private final SecureRandom random = new SecureRandom();
    public AccountRecoveryServiceImpl(UserRepository users, AccountActionTokenRepository actions,
            AuthSessionRepository sessions, PasswordEncoder passwords, AccountMailService mail, Clock clock,
            @Value("${app.recovery.frontend-url:http://localhost:5173}") String frontend) {
        this.users=users; this.actions=actions; this.sessions=sessions; this.passwords=passwords; this.mail=mail; this.clock=clock;
        URI origin = URI.create(frontend);
        if(!List.of("http","https").contains(origin.getScheme()) || origin.getHost()==null || origin.getUserInfo()!=null
                || origin.getQuery()!=null || origin.getFragment()!=null || !(origin.getPath().isEmpty() || origin.getPath().equals("/")))
            throw new IllegalArgumentException("FRONTEND_URL must be an HTTP(S) origin without a path.");
        this.frontend = frontend.replaceAll("/$", "");
    }
    @Override @Transactional public void requestReset(String email) {
        users.lockByEmail(email).ifPresent(user -> issue(user, Purpose.RESET));
    }
    @Override @Transactional public void requestVerification(UUID userId) {
        users.lockById(userId).filter(user -> !user.isEmailVerified()).ifPresent(user -> issue(user, Purpose.VERIFY));
    }
    private void issue(User user, Purpose purpose) {
        var now = clock.instant();
        if(actions.existsByUserIdAndPurposeAndCreatedAtAfter(user.getId(),purpose,now.minusSeconds(60))) return;
        actions.invalidate(user.getId(), purpose, now);
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        actions.saveAndFlush(new AccountActionToken(user.getId(),purpose,hash(raw),now));
        String route = purpose == Purpose.RESET ? "/reset-password" : "/verify-email";
        try { mail.send(user.getEmail(),purpose == Purpose.RESET ? "Reset your CreatorHub password" : "Verify your CreatorHub email",frontend+route+"#token="+raw); }
        catch(MailException exception) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            LoggerFactory.getLogger(getClass()).warn("Account email delivery failed; request can be retried.");
        }
    }
    @Override @Transactional public boolean resetPassword(String raw, String password) { return consume(raw, Purpose.RESET, password); }
    @Override @Transactional public boolean verifyEmail(String raw) { return consume(raw, Purpose.VERIFY, null); }
    private boolean consume(String raw, Purpose purpose, String password) {
        if(raw == null || !raw.matches("[A-Za-z0-9_-]{43}")) return false;
        String hash = hash(raw);
        var owner = actions.owner(hash);
        if(owner.isEmpty()) return false;
        var user = users.lockById(owner.get()).orElse(null);
        if(user == null) return false;
        // Token entity is loaded only after the user lock, avoiding stale state
        // when simultaneous consumers wait on the same user.
        var token = actions.findByTokenHash(hash).orElseThrow();
        if(!token.usable(purpose,clock.instant())) return false;
        token.consume(clock.instant());
        if(purpose == Purpose.RESET) {
            user.changePassword(passwords.encode(password));
            sessions.revokeForUser(user.getId(),clock.instant());
        } else user.verifyEmail(clock.instant());
        actions.invalidate(user.getId(),purpose,clock.instant());
        return true;
    }
    private String hash(String raw) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8))); }
        catch(NoSuchAlgorithmException exception) { throw new IllegalStateException("SHA-256 unavailable",exception); }
    }
}
