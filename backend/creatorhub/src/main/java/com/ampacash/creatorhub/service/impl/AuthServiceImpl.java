package com.ampacash.creatorhub.service.impl;

import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.exception.ApiException;
import com.ampacash.creatorhub.model.*;
import com.ampacash.creatorhub.repository.*;
import com.ampacash.creatorhub.service.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserRepository users;
    private final CreatorRepository creators;
    private final PasswordEncoder passwords;
    private final SessionService sessions;
    private final CreatorService profiles;
    private final String dummyHash;
    public AuthServiceImpl(UserRepository users, CreatorRepository creators, PasswordEncoder passwords, SessionService sessions, CreatorService profiles) {
        this.users = users; this.creators = creators; this.passwords = passwords;
        this.sessions = sessions; this.profiles = profiles;
        this.dummyHash = passwords.encode("dummy-login-comparison-password");
    }
    @Override @Transactional
    public CreatorProfile register(RegistrationRequest request) {
        if (users.existsByEmail(request.email())) throw duplicate();
        User user;
        try {
            user = users.saveAndFlush(new User(request.email(), request.fullName(), passwords.encode(request.password())));
        } catch (DataIntegrityViolationException exception) { throw duplicate(); }
        creators.saveAndFlush(new Creator("local:" + user.getId()));
        return profiles.current(user.getId());
    }
    @Override @Transactional
    public SessionGrant login(LoginRequest request) {
        var user = users.findByEmail(request.email());
        boolean matches = passwords.matches(request.password(), user.map(User::getPasswordHash).orElse(dummyHash));
        if (user.isEmpty() || !matches) throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        return sessions.start(user.get().getId());
    }
    private ApiException duplicate() { return new ApiException(HttpStatus.CONFLICT, "An account with this email already exists."); }
}
