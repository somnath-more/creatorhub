package com.ampacash.creatorhub.service;
import com.ampacash.creatorhub.dto.*;
import java.util.*;
public interface ContentService {
    List<ContentResponse> list(UUID user);
    ContentResponse get(UUID user,UUID id);
    ContentResponse save(UUID user,UUID id,ContentRequest request);
    void delete(UUID user,UUID id,long version);
    ContentResponse publish(UUID user,UUID id,PublicationRequest request,boolean schedule);
    int publishDue();
}
