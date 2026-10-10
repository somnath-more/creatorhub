package com.ampacash.creatorhub.repository;
import com.ampacash.creatorhub.model.Content;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
import java.time.Instant;
public interface ContentRepository extends JpaRepository<Content,UUID> {
    List<Content> findByCreatorIdOrderByUpdatedAtDescIdAsc(UUID creatorId);
    Optional<Content> findByIdAndCreatorId(UUID id,UUID creatorId);
    @Modifying
    @Query(value="""
        WITH due AS (
            SELECT c.id FROM content c JOIN identity_verifications v ON v.creator_id=c.creator_id
            WHERE c.status='SCHEDULED' AND c.media_ready AND c.scheduled_at<=:now AND v.status='VERIFIED'
            ORDER BY c.scheduled_at,c.id LIMIT 100 FOR UPDATE OF c SKIP LOCKED
        ) UPDATE content c SET status='PUBLISHED',published_at=:now,scheduled_at=NULL,updated_at=:now,version=c.version+1
          FROM due WHERE c.id=due.id
        """,nativeQuery=true)
    int publishDue(@Param("now") Instant now);
}
