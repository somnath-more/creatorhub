package com.ampacash.creatorhub.service;
import com.ampacash.creatorhub.dto.*;
public interface AuthService {
    CreatorProfile register(RegistrationRequest request);
    TokenResponse login(LoginRequest request);
}
