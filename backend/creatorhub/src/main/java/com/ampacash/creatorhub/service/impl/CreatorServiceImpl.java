package com.ampacash.creatorhub.service.impl;

import com.ampacash.creatorhub.dto.CreatorProfile;
import com.ampacash.creatorhub.exception.ApiException;
import com.ampacash.creatorhub.repository.*;
import com.ampacash.creatorhub.service.CreatorService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class CreatorServiceImpl implements CreatorService {
    private final UserRepository users;
    private final CreatorRepository creators;
    public CreatorServiceImpl(UserRepository users, CreatorRepository creators) { this.users = users; this.creators = creators; }
    @Override @Transactional(readOnly = true)
    public CreatorProfile current(UUID userId) {
        var user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account is unavailable."));
        var creator = creators.findByPrincipalReference("local:" + userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account is unavailable."));
        return new CreatorProfile(user.getId(), creator.getId(), user.getFullName(), user.getEmail());
    }
}
