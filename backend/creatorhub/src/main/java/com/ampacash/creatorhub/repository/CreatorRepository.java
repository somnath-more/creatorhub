package com.ampacash.creatorhub.repository;

import com.ampacash.creatorhub.model.Creator;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.Optional;

public interface CreatorRepository extends JpaRepository<Creator, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Creator c where c.principalReference=:principal")
    Optional<Creator> lockByPrincipal(@org.springframework.data.repository.query.Param("principal") String principal);
    Optional<Creator> findByPrincipalReference(String principalReference);
}
