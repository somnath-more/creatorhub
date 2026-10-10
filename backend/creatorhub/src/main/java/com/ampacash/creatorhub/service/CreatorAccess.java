package com.ampacash.creatorhub.service;
import com.ampacash.creatorhub.model.Creator;
import com.ampacash.creatorhub.repository.CreatorRepository;
import com.ampacash.creatorhub.exception.ApiException;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;
import java.util.UUID;
@Component
public class CreatorAccess {
    private final CreatorRepository creators;
    public CreatorAccess(CreatorRepository creators) { this.creators=creators; }
    public UUID creatorId(UUID userId,boolean lock) {
        var creator=lock ? creators.lockByPrincipal("local:"+userId) : creators.findByPrincipalReference("local:"+userId);
        return creator.map(Creator::getId).orElseThrow(()->new ApiException(HttpStatus.UNAUTHORIZED,"Account is unavailable."));
    }
}
