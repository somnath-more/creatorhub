package com.ampacash.creatorhub.repository;
import com.ampacash.creatorhub.model.AccountActionToken;
import com.ampacash.creatorhub.model.AccountActionToken.Purpose;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;
public interface AccountActionTokenRepository extends JpaRepository<AccountActionToken, UUID> {
    @Query("select t.userId from AccountActionToken t where t.tokenHash=:hash")
    Optional<UUID> owner(@Param("hash") String hash);
    Optional<AccountActionToken> findByTokenHash(String hash);
    boolean existsByUserIdAndPurposeAndCreatedAtAfter(UUID userId, Purpose purpose, Instant after);
    @Modifying @Query("update AccountActionToken t set t.consumedAt=:now where t.userId=:user and t.purpose=:purpose and t.consumedAt is null")
    void invalidate(@Param("user") UUID user, @Param("purpose") Purpose purpose, @Param("now") Instant now);
}
