package com.ampacash.creatorhub.model;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="content")
public class Content {
    public enum Status { DRAFT, PUBLISHED, SCHEDULED }
    @Id private UUID id;
    @Column(name="creator_id",nullable=false,updatable=false) private UUID creatorId;
    @Column(nullable=false,length=120) private String title;
    @Column(nullable=false,length=5000) private String description;
    @Column(name="price_cents",nullable=false) private int priceCents;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=16) private Status status=Status.DRAFT;
    @Column(name="media_ready",nullable=false) private boolean mediaReady;
    @Embedded @AttributeOverrides({@AttributeOverride(name="name",column=@Column(name="thumbnail_name",length=255)),@AttributeOverride(name="size",column=@Column(name="thumbnail_size")),@AttributeOverride(name="type",column=@Column(name="thumbnail_type",length=100))})
    private MediaFile thumbnail;
    @Embedded @AttributeOverrides({@AttributeOverride(name="name",column=@Column(name="video_name",length=255)),@AttributeOverride(name="size",column=@Column(name="video_size")),@AttributeOverride(name="type",column=@Column(name="video_type",length=100))})
    private MediaFile video;
    @Column(name="scheduled_at") private Instant scheduledAt;
    @Column(name="published_at") private Instant publishedAt;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
    @Column(name="updated_at",nullable=false) private Instant updatedAt;
    @Version private long version;
    protected Content() {}
    public Content(UUID creatorId, Instant now) { id=UUID.randomUUID(); this.creatorId=creatorId; createdAt=now; updatedAt=now; }
    public void edit(String title,String description,int priceCents,MediaFile thumbnail,MediaFile video,Instant now) {
        this.title=title; this.description=description; this.priceCents=priceCents;
        this.thumbnail=thumbnail; this.video=video; status=Status.DRAFT; mediaReady=false;
        scheduledAt=null; publishedAt=null; updatedAt=now;
    }
    public void publish(Instant scheduled,Instant now) {
        status=scheduled==null ? Status.PUBLISHED : Status.SCHEDULED;
        mediaReady=true; scheduledAt=scheduled; publishedAt=scheduled==null ? now : null; updatedAt=now;
    }
    public UUID getId(){return id;} public UUID getCreatorId(){return creatorId;}
    public String getTitle(){return title;} public String getDescription(){return description;}
    public int getPriceCents(){return priceCents;} public Status getStatus(){return status;}
    public boolean isMediaReady(){return mediaReady;} public MediaFile getThumbnail(){return thumbnail;}
    public MediaFile getVideo(){return video;} public Instant getScheduledAt(){return scheduledAt;}
    public Instant getPublishedAt(){return publishedAt;} public Instant getCreatedAt(){return createdAt;}
    public Instant getUpdatedAt(){return updatedAt;} public long getVersion(){return version;}
}
