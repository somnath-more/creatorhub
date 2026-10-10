package com.ampacash.creatorhub.service;
import com.ampacash.creatorhub.dto.*;
import java.util.UUID;
public interface VerificationService {
    VerificationResponse load(UUID user);
    VerificationResponse save(UUID user,VerificationRequest request);
    VerificationResponse approveDemo(UUID user);
}
