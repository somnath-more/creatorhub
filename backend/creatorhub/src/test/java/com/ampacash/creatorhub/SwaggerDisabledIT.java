package com.ampacash.creatorhub;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.env.Environment;
import org.springframework.context.ApplicationContext;
import org.springdoc.webmvc.api.OpenApiWebMvcResource;
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SwaggerDisabledIT extends DatabaseIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired Environment environment;
    @Autowired ApplicationContext context;
    @Test void documentationIsDisabledWithoutDevelopmentProfile() throws Exception {
        assertThat(environment.getProperty("springdoc.api-docs.enabled", Boolean.class)).isFalse();
        assertThat(context.getBeansOfType(OpenApiWebMvcResource.class)).isEmpty();
        mvc.perform(get("/v3/api-docs")).andExpect(status().isUnauthorized());
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isUnauthorized());
    }
}
