package com.ampacash.creatorhub;

import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="app.verification.demo-approval-enabled=false") @AutoConfigureMockMvc
class ContentApiIT extends DatabaseIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AuthService auth;
    String token() {
        String email=UUID.randomUUID()+"@example.com";
        auth.register(new RegistrationRequest("Content Creator",email,"test-password-123"));
        return auth.login(new LoginRequest(email,"test-password-123")).response().accessToken();
    }
    Map<String,Object> input() { return new HashMap<>(Map.of("title","First video","description","A useful tutorial","priceCents",1235)); }
    org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder json(String method, String path, String token, Object body) {
        return request(org.springframework.http.HttpMethod.valueOf(method),path).header("Authorization","Bearer "+token)
            .contentType("application/json").content(mapper.writeValueAsString(body));
    }
    @Test void draftCrudIsPersistentAndOwnerScoped() throws Exception {
        String owner=token(), other=token();
        var created=mvc.perform(json("POST","/api/content",owner,input())).andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("DRAFT")).andReturn();
        var draft=mapper.readTree(created.getResponse().getContentAsString());
        String path="/api/content/"+draft.get("id").asText();
        mvc.perform(get(path).header("Authorization","Bearer "+owner)).andExpect(status().isOk()).andExpect(jsonPath("$.priceCents").value(1235));
        mvc.perform(get("/api/content").header("Authorization","Bearer "+other)).andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get(path).header("Authorization","Bearer "+other)).andExpect(status().isNotFound());
        var edit=input(); edit.put("version",draft.get("version").asLong()); edit.put("title","Updated video");
        mvc.perform(json("PUT",path,other,edit)).andExpect(status().isNotFound());
        mvc.perform(json("PUT",path,owner,edit)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Updated video"));
        mvc.perform(json("PUT",path,owner,edit)).andExpect(status().isConflict());
        mvc.perform(delete(path).param("version","1").header("Authorization","Bearer "+other)).andExpect(status().isNotFound());
        mvc.perform(delete(path).param("version","1").header("Authorization","Bearer "+owner)).andExpect(status().isNoContent());
        mvc.perform(get(path).header("Authorization","Bearer "+owner)).andExpect(status().isNotFound());
    }
    @Test void unverifiedCreatorsCannotPublishEvenByCallingApiDirectly() throws Exception {
        String owner=token();
        var created=mvc.perform(json("POST","/api/content",owner,input())).andExpect(status().isCreated()).andReturn();
        String id=mapper.readTree(created.getResponse().getContentAsString()).get("id").asText();
        mvc.perform(json("POST","/api/content/"+id+"/publish",owner,Map.of("version",0,"mediaReady",true)))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("IDENTITY_VERIFICATION_REQUIRED"));
        mvc.perform(json("PUT","/api/verification",owner,Map.of("status","VERIFIED","step",4)))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/verification/demo-approval").header("Authorization","Bearer "+owner)).andExpect(status().isForbidden());
        mvc.perform(get("/api/content")).andExpect(status().isUnauthorized());
    }
}
