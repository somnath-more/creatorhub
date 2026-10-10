package com.ampacash.creatorhub.service;
import com.ampacash.creatorhub.dto.SessionGrant;
import java.util.*;
public interface SessionService {
    SessionGrant start(UUID userId);
    Optional<SessionGrant> rotate(String token);
    void logout(String token);
    boolean isActive(UUID sessionId, UUID userId);
}
