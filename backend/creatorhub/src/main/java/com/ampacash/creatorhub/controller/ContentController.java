package com.ampacash.creatorhub.controller;
import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.service.ContentService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.*;

@RestController @RequestMapping("/api/content")
@Tag(name="Creator content") @SecurityRequirement(name="bearerAuth")
public class ContentController {
    private final ContentService service;
    public ContentController(ContentService service) { this.service=service; }
    private UUID user(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
    @GetMapping public ResponseEntity<List<ContentResponse>> list(@AuthenticationPrincipal Jwt jwt) { return ok(service.list(user(jwt))); }
    @GetMapping("/{id}") public ResponseEntity<ContentResponse> get(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID id) { return ok(service.get(user(jwt),id)); }
    @PostMapping public ResponseEntity<ContentResponse> create(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody ContentRequest body) {
        var content=service.save(user(jwt),null,body);
        return ResponseEntity.created(URI.create("/api/content/"+content.id())).cacheControl(CacheControl.noStore()).body(content);
    }
    @PutMapping("/{id}") public ResponseEntity<ContentResponse> update(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID id,@Valid @RequestBody ContentRequest body) { return ok(service.save(user(jwt),id,body)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID id,@RequestParam long version) {
        service.delete(user(jwt),id,version); return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }
    @PostMapping("/{id}/publish") public ResponseEntity<ContentResponse> publish(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID id,@Valid @RequestBody PublicationRequest body) { return ok(service.publish(user(jwt),id,body,false)); }
    @PostMapping("/{id}/schedule") public ResponseEntity<ContentResponse> schedule(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID id,@Valid @RequestBody PublicationRequest body) { return ok(service.publish(user(jwt),id,body,true)); }
    private <T> ResponseEntity<T> ok(T value) { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value); }
}
