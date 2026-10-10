package com.ampacash.creatorhub;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.service.*;
import com.ampacash.creatorhub.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc
class AccountRecoveryIT extends DatabaseIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AuthService auth;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @Autowired JdbcTemplate jdbc;
    @Autowired AccountRecoveryService recovery;
    @Autowired SessionService sessions;
    @Autowired org.springframework.security.oauth2.jwt.JwtDecoder decoder;
    private final String oldPassword = "old-password-123";
    private CreatorProfile register() { return auth.register(new RegistrationRequest("Recovery Creator", UUID.randomUUID()+"@example.com", oldPassword)); }
    private String capturedToken() {
        var capture = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(accountMail, atLeastOnce()).send(anyString(), anyString(), capture.capture());
        return java.net.URI.create(capture.getValue()).getFragment().substring("token=".length());
    }
    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder action(String path, Object body) {
        return post(path).contentType("application/json").content(mapper.writeValueAsString(body));
    }
    @Test void forgotPasswordDoesNotRevealAccountsAndResetRevokesSessions() throws Exception {
        var profile = register();
        var session = auth.login(new LoginRequest(profile.email(), oldPassword));
        for(String email : List.of(profile.email(), "unknown@example.com")) {
            mvc.perform(action("/api/auth/forgot-password", Map.of("email", email))).andExpect(status().isAccepted())
                    .andExpect(jsonPath("$.message").value("If eligible, an email will be sent. Check your inbox and spam folder."));
        }
        String token = capturedToken();
        mvc.perform(action("/api/auth/reset-password", Map.of("token", token, "password", "new-password-123")))
                .andExpect(status().isNoContent());
        assertThat(passwords.matches("new-password-123", users.findById(profile.userId()).orElseThrow().getPasswordHash())).isTrue();
        mvc.perform(get("/api/me").header("Authorization", "Bearer "+session.response().accessToken())).andExpect(status().isUnauthorized());
        mvc.perform(action("/api/auth/reset-password", Map.of("token", token, "password", "another-password-123"))).andExpect(status().isBadRequest());
        assertThatThrownBy(() -> auth.login(new LoginRequest(profile.email(), oldPassword))).isInstanceOf(RuntimeException.class);
        assertThat(auth.login(new LoginRequest(profile.email(), "new-password-123"))).isNotNull();
    }
    @Test void verificationTokenCannotResetPasswordAndIsSingleUse() throws Exception {
        var profile = register();
        var session = auth.login(new LoginRequest(profile.email(), oldPassword));
        mvc.perform(post("/api/account/email-verification/resend").header("Authorization", "Bearer "+session.response().accessToken()))
                .andExpect(status().isAccepted());
        String token = capturedToken();
        mvc.perform(action("/api/auth/reset-password", Map.of("token", token, "password", "new-password-123"))).andExpect(status().isBadRequest());
        mvc.perform(action("/api/auth/verify-email", Map.of("token", token))).andExpect(status().isNoContent());
        mvc.perform(get("/api/me").header("Authorization", "Bearer "+session.response().accessToken()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.emailVerified").value(true));
        mvc.perform(action("/api/auth/verify-email", Map.of("token", token))).andExpect(status().isBadRequest());
    }
    @Test void deliveryFailurePreservesAccountAndAllowsRetry() throws Exception {
        var profile = register();
        doThrow(new org.springframework.mail.MailSendException("offline")).when(accountMail).send(anyString(), anyString(), anyString());
        mvc.perform(action("/api/auth/forgot-password", Map.of("email", profile.email()))).andExpect(status().isAccepted());
        assertThat(jdbc.queryForObject("select count(*) from account_action_tokens where user_id=?", Integer.class, profile.userId())).isZero();
        reset(accountMail);
        recovery.requestReset(profile.email());
        assertThat(capturedToken()).hasSize(43);
    }
    @Test void cooldownAndReissueInvalidateEarlierLink() throws Exception {
        var profile = register();
        recovery.requestReset(profile.email());
        String first = capturedToken();
        recovery.requestReset(profile.email());
        verify(accountMail, times(1)).send(anyString(), anyString(), anyString());
        jdbc.update("update account_action_tokens set created_at=now()-interval '2 minutes' where user_id=?", profile.userId());
        recovery.requestReset(profile.email());
        String second = capturedToken();
        assertThat(second).isNotEqualTo(first);
        assertThat(recovery.resetPassword(first, "new-password-123")).isFalse();
        assertThat(recovery.resetPassword(second, "new-password-123")).isTrue();
    }
    @Test void expiredTokensAndInvalidPasswordsAreRejected() throws Exception {
        var profile = register();
        mvc.perform(action("/api/auth/forgot-password", Map.of("email", profile.email()))).andExpect(status().isAccepted());
        String token = capturedToken();
        mvc.perform(action("/api/auth/reset-password", Map.of("token", token, "password", "short"))).andExpect(status().isBadRequest());
        jdbc.update("update account_action_tokens set expires_at=now()-interval '1 second' where user_id=?", profile.userId());
        mvc.perform(action("/api/auth/reset-password", Map.of("token", token, "password", "new-password-123"))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/account/email-verification/resend")).andExpect(status().isUnauthorized());
    }
    @Test void concurrentConsumersCanOnlyUseTheTokenOnce() throws Exception {
        var profile = register();
        recovery.requestReset(profile.email());
        String token = capturedToken();
        assertThat(jdbc.queryForObject("select token_hash from account_action_tokens where user_id=?", String.class, profile.userId())).hasSize(64).isNotEqualTo(token);
        var ready = new java.util.concurrent.CountDownLatch(2);
        var start = new java.util.concurrent.CountDownLatch(1);
        var executor = java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            java.util.concurrent.Callable<Boolean> consume = () -> { ready.countDown(); start.await(); return recovery.resetPassword(token, "new-password-123"); };
            var first = executor.submit(consume); var second = executor.submit(consume);
            assertThat(ready.await(10, java.util.concurrent.TimeUnit.SECONDS)).isTrue(); start.countDown();
            assertThat(List.of(first.get(10, java.util.concurrent.TimeUnit.SECONDS), second.get(10, java.util.concurrent.TimeUnit.SECONDS))).containsExactlyInAnyOrder(true, false);
        } finally { start.countDown(); executor.shutdownNow(); }
    }
    @Test void resetRacingLoginAndRefreshLeavesNoOldSessionActive() throws Exception {
        var profile = register();
        var existing = auth.login(new LoginRequest(profile.email(), oldPassword));
        recovery.requestReset(profile.email()); String token = capturedToken();
        var start = new java.util.concurrent.CountDownLatch(1);
        var executor = java.util.concurrent.Executors.newFixedThreadPool(3);
        try {
            var reset = executor.submit(() -> { start.await(); return recovery.resetPassword(token, "new-password-123"); });
            var login = executor.submit(() -> { start.await(); try { return auth.login(new LoginRequest(profile.email(), oldPassword)); } catch (com.ampacash.creatorhub.exception.ApiException expected) { return null; } });
            var refresh = executor.submit(() -> { start.await(); return sessions.rotate(existing.refreshToken()); });
            start.countDown();
            assertThat(reset.get(15, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            var racedLogin = login.get(15, java.util.concurrent.TimeUnit.SECONDS);
            var racedRefresh = refresh.get(15, java.util.concurrent.TimeUnit.SECONDS);
            for (var grant : List.of(Optional.ofNullable(racedLogin), racedRefresh)) {
                if(grant.isPresent()) {
                    assertThatThrownBy(() -> decoder.decode(grant.get().response().accessToken())).isInstanceOf(org.springframework.security.oauth2.jwt.JwtException.class);
                    assertThat(sessions.rotate(grant.get().refreshToken())).isEmpty();
                }
            }
            assertThat(sessions.rotate(existing.refreshToken())).isEmpty();
        } finally { start.countDown(); executor.shutdownNow(); }
    }
}
