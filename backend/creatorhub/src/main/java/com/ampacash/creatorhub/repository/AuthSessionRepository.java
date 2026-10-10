package com.ampacash.creatorhub.repository;
import com.ampacash.creatorhub.model.AuthSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
import java.time.Instant;
public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from AuthSession s where s.id = :id")
    Optional<AuthSession> lockById(@Param("id") UUID id);
    @Modifying @Query("update AuthSession s set s.revokedAt=:now where s.userId=:user and s.revokedAt is null")
    void revokeForUser(@Param("user") UUID user, @Param("now") Instant now);
}
