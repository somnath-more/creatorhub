package com.ampacash.creatorhub.config;
import com.ampacash.creatorhub.service.ContentService;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.*;
@Configuration @EnableScheduling
public class PublicationScheduler {
    private final ContentService contents;
    public PublicationScheduler(ContentService contents) { this.contents=contents; }
    @Scheduled(fixedDelayString="${app.publication.poll-ms:15000}",initialDelayString="${app.publication.poll-ms:15000}")
    public void publishDue() { contents.publishDue(); }
}
