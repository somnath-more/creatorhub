package com.ampacash.creatorhub;

import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.model.Creator;
import com.ampacash.creatorhub.repository.*;
import com.ampacash.creatorhub.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class AuthenticationIT extends DatabaseIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @Autowired AuthService auth;
    @MockitoSpyBean CreatorRepository creators;
    private final String password = "correct horse battery staple";
    private String email() { return UUID.randomUUID() + "@example.com"; }
    private String body(String email, String password) { return mapper.writeValueAsString(Map.of("fullName", "Test Creator", "email", email, "password", password)); }

    @Test void registerLoginAndMeUseHashedPasswordsAndServerOwnedIdentity() throws Exception {
        String email = email();
        var registration = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(" " + email.toUpperCase(Locale.ROOT) + " ", password)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.passwordHash").doesNotExist()).andReturn();
        var profile = mapper.readTree(registration.getResponse().getContentAsString());
        var user = users.findByEmail(email).orElseThrow();
        assertThat(user.getPasswordHash()).isNotEqualTo(password);
        assertThat(passwords.matches(password, user.getPasswordHash())).isTrue();
        var login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body(email, password)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.expiresIn").value(900))
                .andExpect(header().string("Cache-Control", "no-store")).andReturn();
        String token = mapper.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + token).param("creatorId", UUID.randomUUID().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(profile.get("userId").asText()))
                .andExpect(jsonPath("$.creatorId").value(profile.get("creatorId").asText()));
    }

    @Test void duplicateAndInvalidCredentialsUseSafeErrors() throws Exception {
        String email = email();
        auth.register(new RegistrationRequest("Creator", email, password));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(email.toUpperCase(Locale.ROOT), password)))
                .andExpect(status().isConflict()).andExpect(content().contentTypeCompatibleWith("application/problem+json"));
        for (String loginEmail : List.of(email, email())) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body(loginEmail, "wrong password")))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.detail").value("Invalid email or password."));
        }
    }

    @Test void twoAccountsCannotSelectEachOthersIdentity() throws Exception {
        var first = auth.register(new RegistrationRequest("First", email(), password));
        var second = auth.register(new RegistrationRequest("Second", email(), password));
        String token = auth.login(new LoginRequest(first.email(), password)).accessToken();
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + token)
                        .param("userId", second.userId().toString()).param("creatorId", second.creatorId().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(first.userId().toString()))
                .andExpect(jsonPath("$.creatorId").value(first.creatorId().toString()));
    }

    @Test void databaseRejectsDuplicateEmailEvenWhenPrecheckIsBypassed() {
        String email = email();
        auth.register(new RegistrationRequest("First", email, password));
        assertThatThrownBy(() -> users.saveAndFlush(new com.ampacash.creatorhub.model.User(email, "Second", "test-hash")))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThat(users.findByEmail(email)).isPresent();
    }

    @Test void invalidRequestsAndMissingOrTamperedTokensAreRejected() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body("not-email", "é".repeat(37))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors").isArray());
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized()).andExpect(header().string("WWW-Authenticate", "Bearer"));
        mvc.perform(get("/api/me").header("Authorization", "Bearer invalid.token.signature"))
                .andExpect(status().isUnauthorized()).andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    @Test void failedCreatorCreationRollsBackUser() {
        String email = email();
        doThrow(new IllegalStateException("Simulated profile write failure")).when(creators).saveAndFlush(any(Creator.class));
        assertThatThrownBy(() -> auth.register(new RegistrationRequest("Creator", email, password))).isInstanceOf(IllegalStateException.class);
        assertThat(users.findByEmail(email)).isEmpty();
    }

    @Test void developmentSwaggerDocumentsBearerSecurityAndWriteOnlyPasswords() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"))
                .andExpect(jsonPath("$.paths['/api/me'].get.security[0].bearerAuth").isArray())
                .andExpect(jsonPath("$.components.schemas.RegistrationRequest.properties.password.writeOnly").value(true));
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
    }
}
