package com.ampacash.creatorhub.service.impl;
import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.model.*;
import com.ampacash.creatorhub.repository.*;
import com.ampacash.creatorhub.service.*;
import com.ampacash.creatorhub.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.util.*;

@Service
public class ContentServiceImpl implements ContentService {
    private final CreatorAccess access;
    private final ContentRepository contents;
    private final IdentityVerificationRepository verifications;
    private final Clock clock;
    public ContentServiceImpl(CreatorAccess access,ContentRepository contents,IdentityVerificationRepository verifications,Clock clock) {
        this.access=access; this.contents=contents; this.verifications=verifications; this.clock=clock;
    }
    @Override @Transactional(readOnly=true) public List<ContentResponse> list(UUID user) {
        return contents.findByCreatorIdOrderByUpdatedAtDescIdAsc(access.creatorId(user,false)).stream().map(ContentResponse::from).toList();
    }
    @Override @Transactional(readOnly=true) public ContentResponse get(UUID user,UUID id) { return ContentResponse.from(owned(id,access.creatorId(user,false))); }
    @Override @Transactional public ContentResponse save(UUID user,UUID id,ContentRequest r) {
        UUID creator=access.creatorId(user,true);
        Content c=id==null ? new Content(creator,clock.instant()) : owned(id,creator);
        if(id!=null) version(c,r.version());
        validateMedia(r.thumbnail(),true); validateMedia(r.video(),false);
        c.edit(r.title(),r.description(),r.priceCents().intValueExact(),r.thumbnail()==null?null:r.thumbnail().toModel(),r.video()==null?null:r.video().toModel(),clock.instant());
        return ContentResponse.from(contents.saveAndFlush(c));
    }
    @Override @Transactional public void delete(UUID user,UUID id,long version) {
        Content c=owned(id,access.creatorId(user,true)); version(c,version); contents.delete(c); contents.flush();
    }
    @Override @Transactional public ContentResponse publish(UUID user,UUID id,PublicationRequest r,boolean schedule) {
        UUID creator=access.creatorId(user,true); Content c=owned(id,creator);
        if(verifications.findById(creator).map(v->v.getStatus()!=IdentityVerification.Status.VERIFIED).orElse(true))
            throw new ApiException(HttpStatus.FORBIDDEN,"Complete identity verification before publishing or scheduling.","IDENTITY_VERIFICATION_REQUIRED");
        version(c,r.version());
        if(c.getStatus()==Content.Status.PUBLISHED) throw new ApiException(HttpStatus.CONFLICT,"This content is already published. Reopen the editor to make changes.");
        if(!r.mediaReady() || c.getThumbnail()==null || c.getVideo()==null)
            throw new ApiException(HttpStatus.BAD_REQUEST,"Select and complete both simulated media uploads before publishing.");
        var now=clock.instant();
        if(schedule && (r.scheduledAt()==null || !r.scheduledAt().isAfter(now))) throw new ApiException(HttpStatus.BAD_REQUEST,"Choose a publication date in the future.");
        if(!schedule && r.scheduledAt()!=null) throw new ApiException(HttpStatus.BAD_REQUEST,"Use the schedule endpoint for a future publication.");
        c.publish(schedule ? r.scheduledAt() : null,now); contents.flush(); return ContentResponse.from(c);
    }
    @Override @Transactional public int publishDue() { return contents.publishDue(clock.instant()); }
    private Content owned(UUID id,UUID creator) { return contents.findByIdAndCreatorId(id,creator).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"Content not found.")); }
    private void version(Content c,Long expected) {
        if(expected==null) throw new ApiException(HttpStatus.BAD_REQUEST,"A content version is required. Reopen the page.");
        if(c.getVersion()!=expected) throw new ApiException(HttpStatus.CONFLICT,"This content changed. Reopen the page before saving or publishing.");
    }
    private void validateMedia(MediaMetadata file,boolean thumbnail) {
        if(file==null) return;
        var types=thumbnail ? List.of("image/jpeg","image/png","image/webp") : List.of("video/mp4","video/webm","video/quicktime");
        long max=thumbnail?5242880L:2147483648L;
        if(!types.contains(file.type()) || file.size()>max) throw new ApiException(HttpStatus.BAD_REQUEST,"Choose a supported "+(thumbnail?"thumbnail up to 5 MB.":"video up to 2 GB."));
    }
}
