package com.ampacash.creatorhub;

import com.ampacash.creatorhub.exception.ApiExceptionHandler;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ApiFoundationTests {
    private MockMvc mvc;
    @BeforeEach void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @Test void invalidFieldsReturnSafeProblemDetails() throws Exception {
        mvc.perform(post("/test/validation").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"\"}"))
                .andExpect(status().isBadRequest()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.instance").value("/test/validation"))
                .andExpect(jsonPath("$.errors[0].field").value("title"))
                .andExpect(jsonPath("$.errors[0].message").value("Enter a title."));
    }
    @Test void malformedJsonDoesNotExposeParserInternals() throws Exception {
        mvc.perform(post("/test/validation").contentType(MediaType.APPLICATION_JSON).content("{broken"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").value("Request body is missing or invalid JSON."));
    }
    @Test void unexpectedErrorsDoNotExposeServerDetails() throws Exception {
        mvc.perform(get("/test/failure")).andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred. Try again later."));
    }
    @Test void unsupportedMethodsUseProblemJson() throws Exception {
        mvc.perform(put("/test/failure")).andExpect(status().isMethodNotAllowed())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }
    @RestController static class TestController {
        record Input(@NotBlank(message = "Enter a title.") String title) {}
        @PostMapping("/test/validation") Input validate(@Valid @RequestBody Input input) { return input; }
        @GetMapping("/test/failure") void fail() { throw new IllegalStateException("Internal SQL/secret must not reach clients"); }
    }
}
