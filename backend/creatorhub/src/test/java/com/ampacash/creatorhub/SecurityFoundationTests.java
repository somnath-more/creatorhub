package com.ampacash.creatorhub;

import com.ampacash.creatorhub.config.SecurityConfig;
import com.ampacash.creatorhub.exception.ApiProblemWriter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SecurityFoundationTests.TestController.class)
@Import({SecurityConfig.class, ApiProblemWriter.class, SecurityFoundationTests.TestController.class})
class SecurityFoundationTests {
    @Autowired MockMvc mvc;
    @MockitoBean JwtDecoder decoder;
    @Test void healthIsPublicButApplicationRoutesAreDenied() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        for (String path : new String[]{"/api/content", "/login", "/actuator/env"}) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized())
                    .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.instance").value(path))
                    .andExpect(header().doesNotExist("Location"));
        }
    }
    @Test void authenticatedRequestsStillCannotAccessUnfinishedApis() throws Exception {
        mvc.perform(get("/api/content").with(user("test"))).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
    @Test void approvedPreflightHasExactOriginAndCredentials() throws Exception {
        mvc.perform(options("/api/content").header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization, Content-Type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }
    @Test void similarUnapprovedOriginsAreRejected() throws Exception {
        for (String origin : new String[]{"https://example.com", "http://localhost:5173.evil.com", "null"}) {
            mvc.perform(options("/api/content").header("Origin", origin).header("Access-Control-Request-Method", "GET"))
                    .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        }
    }
    @Test void postDoesNotBypassDefaultDeny() throws Exception {
        mvc.perform(post("/api/content")).andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }
    @RestController static class TestController {
        @GetMapping("/actuator/health") Map<String, String> health() { return Map.of("status", "UP"); }
    }
}
