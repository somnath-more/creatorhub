package com.ampacash.creatorhub;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SessionAuthenticationIT extends DatabaseIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Autowired com.ampacash.creatorhub.service.SessionService sessions;
    @Autowired org.springframework.security.oauth2.jwt.JwtDecoder decoder;
    record Login(String access, Cookie refresh) {}
    private Cookie csrf() throws Exception {
        return mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn().getResponse().getCookie("XSRF-TOKEN");
    }
    private Login login(String email) throws Exception {
        Cookie csrf = csrf();
        var result = mvc.perform(post("/api/auth/login").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
                .contentType("application/json").content(mapper.writeValueAsString(Map.of("email", email, "password", "test-password-123"))))
                .andExpect(status().isOk()).andReturn();
        return new Login(mapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText(), result.getResponse().getCookie("creatorhub-refresh"));
    }
    private String register() throws Exception {
        String email = UUID.randomUUID() + "@example.com";
        mvc.perform(post("/api/auth/register").contentType("application/json")
                .content(mapper.writeValueAsString(Map.of("fullName", "Session Creator", "email", email, "password", "test-password-123"))))
                .andExpect(status().isCreated());
        return email;
    }
    private MvcResult refresh(Cookie cookie, int expected) throws Exception {
        Cookie csrf = csrf();
        return mvc.perform(post("/api/auth/refresh").cookie(cookie, csrf).header("X-XSRF-TOKEN", csrf.getValue()))
                .andExpect(status().is(expected)).andReturn();
    }
    @Test void rotationReplayAndImmediateRevocation() throws Exception {
        var login = login(register());
        assertThat(login.refresh().isHttpOnly()).isTrue();
        assertThat(login.refresh().getSecure()).isTrue();
        assertThat(login.refresh().getPath()).isEqualTo("/api/auth");
        assertThat(login.refresh().getAttribute("SameSite")).isEqualTo("Lax");
        var rotated = refresh(login.refresh(), 200);
        Cookie replacement = rotated.getResponse().getCookie("creatorhub-refresh");
        assertThat(replacement.getValue()).isNotEqualTo(login.refresh().getValue());
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + login.access())).andExpect(status().isOk());
        refresh(login.refresh(), 401);
        refresh(replacement, 401);
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + login.access())).andExpect(status().isUnauthorized());
    }
    @Test void logoutRevokesOnlyCurrentSessionAndIsIdempotent() throws Exception {
        String email = register();
        var first = login(email);
        var second = login(email);
        Cookie csrf = csrf();
        mvc.perform(post("/api/auth/logout").cookie(first.refresh(), csrf).header("X-XSRF-TOKEN", csrf.getValue()))
                .andExpect(status().isNoContent()).andExpect(cookie().maxAge("creatorhub-refresh", 0));
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + first.access())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + second.access())).andExpect(status().isOk());
        refresh(first.refresh(), 401);
        refresh(second.refresh(), 200);
        mvc.perform(post("/api/auth/logout").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())).andExpect(status().isNoContent());
    }
    @Test void cookieWritesRequireCsrfAndInvalidRefreshIsSafe() throws Exception {
        mvc.perform(post("/api/auth/login").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden()).andExpect(content().contentTypeCompatibleWith("application/problem+json"));
        mvc.perform(post("/api/auth/refresh")).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/logout")).andExpect(status().isForbidden());
        refresh(new Cookie("creatorhub-refresh", "unknown"), 401);
        Cookie csrf = csrf();
        mvc.perform(post("/api/auth/refresh").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue()))
                .andExpect(status().isUnauthorized()).andExpect(cookie().maxAge("creatorhub-refresh", 0));
    }

    @Test void absoluteSessionExpiryRejectsRefreshAndAccess() throws Exception {
        var login = login(register());
        UUID sid = UUID.fromString(decoder.decode(login.access()).getClaimAsString("sid"));
        jdbc.update("update auth_sessions set expires_at = now() - interval '1 second' where id = ?", sid);
        refresh(login.refresh(), 401);
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + login.access())).andExpect(status().isUnauthorized());
    }

    @Test void concurrentRefreshCannotConsumeTheSameTokenTwice() throws Exception {
        var login = login(register());
        var jwt = decoder.decode(login.access());
        UUID sid = UUID.fromString(jwt.getClaimAsString("sid"));
        UUID user = UUID.fromString(jwt.getSubject());
        var ready = new java.util.concurrent.CountDownLatch(2);
        var start = new java.util.concurrent.CountDownLatch(1);
        var executor = java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            java.util.concurrent.Callable<Boolean> action = () -> {
                ready.countDown(); start.await();
                return sessions.rotate(login.refresh().getValue()).isPresent();
            };
            var first = executor.submit(action); var second = executor.submit(action);
            assertThat(ready.await(10, java.util.concurrent.TimeUnit.SECONDS)).isTrue(); start.countDown();
            assertThat(List.of(first.get(10, java.util.concurrent.TimeUnit.SECONDS), second.get(10, java.util.concurrent.TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
            assertThat(sessions.isActive(sid, user)).isFalse();
        } finally { executor.shutdownNow(); }
    }
}
