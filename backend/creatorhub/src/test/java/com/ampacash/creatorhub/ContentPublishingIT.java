package com.ampacash.creatorhub;
import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"app.verification.demo-approval-enabled=true","app.publication.poll-ms=3600000"})
@AutoConfigureMockMvc
class ContentPublishingIT extends DatabaseIntegrationTest {
    @Autowired MockMvc mvc; @Autowired ObjectMapper mapper; @Autowired AuthService auth;
    @Autowired ContentService contents; @Autowired JdbcTemplate jdbc;
    String token() {
        String email=UUID.randomUUID()+"@example.com";
        auth.register(new RegistrationRequest("Publishing Creator",email,"test-password-123"));
        return auth.login(new LoginRequest(email,"test-password-123")).response().accessToken();
    }
    org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder json(String method,String path,String token,Object body) {
        return request(org.springframework.http.HttpMethod.valueOf(method),path).header("Authorization","Bearer "+token).contentType("application/json").content(mapper.writeValueAsString(body));
    }
    Map<String,Object> input() { return new HashMap<>(Map.of("title","Published tutorial","description","Sample content","priceCents",29,
        "thumbnail",Map.of("name","sample.png","size",10,"type","image/png"),"video",Map.of("name","sample.mp4","size",100,"type","video/mp4"))); }
    Map<String,Object> progress(int step,String status) { return new HashMap<>(Map.of("step",step,"status",status,"personal",Map.of("fullName","Fictional Creator","dateOfBirth","1995-04-18","country","India"),"documentType","PASSPORT","documentSelected",true,"selfieSelected",true)); }
    void approve(String token) throws Exception {
        for(int step=1;step<=4;step++) mvc.perform(json("PUT","/api/verification",token,progress(step,step==4?"SUBMITTED":"IN_PROGRESS"))).andExpect(status().isOk());
        mvc.perform(post("/api/verification/demo-approval").header("Authorization","Bearer "+token)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("VERIFIED"));
    }
    String create(String token) throws Exception { return mapper.readTree(mvc.perform(json("POST","/api/content",token,input())).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asText(); }
    @Test void submittedIdentityStillBlocksPublishingAndOtherAccountsStayUnverified() throws Exception {
        String owner=token(),other=token(),id=create(owner);
        mvc.perform(post("/api/verification/demo-approval").header("Authorization","Bearer "+owner)).andExpect(status().isConflict());
        mvc.perform(json("PUT","/api/verification",owner,progress(4,"SUBMITTED"))).andExpect(status().isBadRequest());
        for(int step=1;step<=4;step++) mvc.perform(json("PUT","/api/verification",owner,progress(step,step==4?"SUBMITTED":"IN_PROGRESS"))).andExpect(status().isOk());
        mvc.perform(json("POST","/api/content/"+id+"/publish",owner,Map.of("version",0,"mediaReady",true))).andExpect(status().isForbidden());
        mvc.perform(post("/api/verification/demo-approval").header("Authorization","Bearer "+owner)).andExpect(status().isOk());
        mvc.perform(get("/api/verification").header("Authorization","Bearer "+other)).andExpect(jsonPath("$.status").value("NOT_STARTED"));
        mvc.perform(json("POST","/api/content/"+id+"/publish",other,Map.of("version",0,"mediaReady",true))).andExpect(status().isNotFound());
        mvc.perform(json("POST","/api/content/"+id+"/publish",owner,Map.of("version",0,"mediaReady",true))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"));
        mvc.perform(json("PUT","/api/verification",owner,progress(1,"IN_PROGRESS"))).andExpect(status().isConflict());
        var edit=input(); edit.put("version",1);
        mvc.perform(json("PUT","/api/content/"+id,owner,edit)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT")).andExpect(jsonPath("$.mediaStatus").value("NOT_READY")).andExpect(jsonPath("$.publishedAt").doesNotExist());
    }
    @Test void backendPublishesDueSchedulesAndEditingCancelsThem() throws Exception {
        String owner=token(); approve(owner); String id=create(owner),cancelled=create(owner),removed=create(owner);
        for(String item:List.of(id,cancelled,removed)) mvc.perform(json("POST","/api/content/"+item+"/schedule",owner,Map.of("version",0,"mediaReady",true,"scheduledAt",Instant.now().plusSeconds(3600).toString()))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("SCHEDULED"));
        var edit=input(); edit.put("version",1);
        mvc.perform(json("PUT","/api/content/"+cancelled,owner,edit)).andExpect(status().isOk()).andExpect(jsonPath("$.scheduledAt").doesNotExist());
        mvc.perform(delete("/api/content/"+removed).param("version","1").header("Authorization","Bearer "+owner)).andExpect(status().isNoContent());
        jdbc.update("update content set scheduled_at=now()-interval '1 second' where id=?",UUID.fromString(id));
        assertThat(contents.publishDue()).isEqualTo(1); assertThat(contents.publishDue()).isZero();
        mvc.perform(get("/api/content/"+id).header("Authorization","Bearer "+owner)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED")).andExpect(jsonPath("$.version").value(2));
        mvc.perform(get("/api/content/"+cancelled).header("Authorization","Bearer "+owner)).andExpect(jsonPath("$.status").value("DRAFT"));
        mvc.perform(delete("/api/content/"+id).param("version","1").header("Authorization","Bearer "+owner)).andExpect(status().isConflict());
    }
    @Test void invalidPricesMediaAndPublicationDatesAreRejected() throws Exception {
        String owner=token();
        for(Object price:List.of(-1,100000000,1.25)) { var r=input();r.put("priceCents",price); mvc.perform(json("POST","/api/content",owner,r)).andExpect(status().isBadRequest()); }
        var invalid=input(); invalid.put("thumbnail",Map.of("name","bad.exe","size",10,"type","application/octet-stream"));
        mvc.perform(json("POST","/api/content",owner,invalid)).andExpect(status().isBadRequest());
        invalid=input();invalid.put("thumbnail",Map.of("name","large.png","size",5242881,"type","image/png"));
        mvc.perform(json("POST","/api/content",owner,invalid)).andExpect(status().isBadRequest());
        approve(owner);String id=create(owner);
        mvc.perform(json("POST","/api/content/"+id+"/publish",owner,Map.of("version",0,"mediaReady",false))).andExpect(status().isBadRequest());
        mvc.perform(json("POST","/api/content/"+id+"/schedule",owner,Map.of("version",0,"mediaReady",true,"scheduledAt","2020-01-01T00:00:00Z"))).andExpect(status().isBadRequest());
        var missing=input();missing.remove("video");String missingId=mapper.readTree(mvc.perform(json("POST","/api/content",owner,missing)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asText();
        mvc.perform(json("POST","/api/content/"+missingId+"/publish",owner,Map.of("version",0,"mediaReady",true))).andExpect(status().isBadRequest());
    }
    @Test void invalidPersonalInformationAndMissingSimulatedEvidenceCannotAdvance() throws Exception {
        String owner=token();mvc.perform(json("PUT","/api/verification",owner,progress(1,"IN_PROGRESS"))).andExpect(status().isOk());
        var bad=progress(2,"IN_PROGRESS");bad.put("personal",Map.of("fullName","","dateOfBirth","2099-01-01","country","India"));
        mvc.perform(json("PUT","/api/verification",owner,bad)).andExpect(status().isBadRequest());
        mvc.perform(json("PUT","/api/verification",owner,progress(2,"IN_PROGRESS"))).andExpect(status().isOk());
        bad=progress(3,"IN_PROGRESS");bad.put("documentSelected",false);
        mvc.perform(json("PUT","/api/verification",owner,bad)).andExpect(status().isBadRequest());
        mvc.perform(json("PUT","/api/verification",owner,progress(3,"IN_PROGRESS"))).andExpect(status().isOk());
        bad=progress(4,"SUBMITTED");bad.put("selfieSelected",false);
        mvc.perform(json("PUT","/api/verification",owner,bad)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/verification").header("Authorization","Bearer "+owner)).andExpect(jsonPath("$.step").value(3));
    }
    @Test void concurrentEditsCannotOverwriteTheSameVersion() throws Exception {
        String owner=token(),id=create(owner);var edit=input();edit.put("version",0);
        var ready=new java.util.concurrent.CountDownLatch(2);var start=new java.util.concurrent.CountDownLatch(1);
        var executor=java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            java.util.concurrent.Callable<Integer> save=()->{ready.countDown();start.await();return mvc.perform(json("PUT","/api/content/"+id,owner,edit)).andReturn().getResponse().getStatus();};
            var first=executor.submit(save);var second=executor.submit(save);
            assertThat(ready.await(10,java.util.concurrent.TimeUnit.SECONDS)).isTrue();start.countDown();
            assertThat(List.of(first.get(10,java.util.concurrent.TimeUnit.SECONDS),second.get(10,java.util.concurrent.TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,409);
        } finally {start.countDown();executor.shutdownNow();}
    }
    @Test void dueJobRechecksPersistedIdentityVerification() throws Exception {
        String owner=token();approve(owner);String id=create(owner);
        mvc.perform(json("POST","/api/content/"+id+"/schedule",owner,Map.of("version",0,"mediaReady",true,"scheduledAt",Instant.now().plusSeconds(3600).toString()))).andExpect(status().isOk());
        jdbc.update("update content set scheduled_at=now()-interval '1 second' where id=?",UUID.fromString(id));
        jdbc.update("update identity_verifications set status='SUBMITTED',approved_at=null where creator_id=(select creator_id from content where id=?)",UUID.fromString(id));
        assertThat(contents.publishDue()).isZero();
        mvc.perform(get("/api/content/"+id).header("Authorization","Bearer "+owner)).andExpect(jsonPath("$.status").value("SCHEDULED"));
    }
}
