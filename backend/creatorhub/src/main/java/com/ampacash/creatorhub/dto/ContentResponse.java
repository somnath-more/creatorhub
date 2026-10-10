package com.ampacash.creatorhub.dto;
import com.ampacash.creatorhub.model.Content;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ContentResponse(UUID id,String title,String description,int priceCents,String currency,
        Content.Status status,String mediaStatus,MediaMetadata thumbnail,MediaMetadata video,
        Instant scheduledAt,Instant publishedAt,Instant createdAt,Instant updatedAt,long version) {
    public static ContentResponse from(Content c) {
        return new ContentResponse(c.getId(),c.getTitle(),c.getDescription(),c.getPriceCents(),"USD",c.getStatus(),
            c.isMediaReady()?"READY":"NOT_READY",MediaMetadata.from(c.getThumbnail()),MediaMetadata.from(c.getVideo()),
            c.getScheduledAt(),c.getPublishedAt(),c.getCreatedAt(),c.getUpdatedAt(),c.getVersion());
    }
}
