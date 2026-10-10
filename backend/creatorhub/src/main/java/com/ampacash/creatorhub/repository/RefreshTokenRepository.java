package com.ampacash.creatorhub.repository;
import com.ampacash.creatorhub.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String hash);
    @Query("select t.sessionId from RefreshToken t where t.tokenHash = :hash")
    Optional<UUID> findSessionIdByTokenHash(@Param("hash") String hash);
}
