package com.ampacash.creatorhub.service;
import java.util.UUID;
public interface AccountRecoveryService {
    void requestReset(String email);
    void requestVerification(UUID userId);
    boolean resetPassword(String raw, String password);
    boolean verifyEmail(String raw);
}
