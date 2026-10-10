package com.ampacash.creatorhub.service.impl;
import com.ampacash.creatorhub.dto.*;
import com.ampacash.creatorhub.model.IdentityVerification;
import com.ampacash.creatorhub.repository.IdentityVerificationRepository;
import com.ampacash.creatorhub.service.*;
import com.ampacash.creatorhub.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.UUID;

@Service
public class VerificationServiceImpl implements VerificationService {
    private final CreatorAccess access;
    private final IdentityVerificationRepository records;
    private final Clock clock;
    private final boolean demo;
    public VerificationServiceImpl(CreatorAccess access,IdentityVerificationRepository records,Clock clock,
            @Value("${app.verification.demo-approval-enabled:false}") boolean demo) { this.access=access; this.records=records; this.clock=clock; this.demo=demo; }
    @Override @Transactional(readOnly=true) public VerificationResponse load(UUID user) {
        UUID creator=access.creatorId(user,false); return response(records.findById(creator).orElseGet(()->new IdentityVerification(creator)));
    }
    @Override @Transactional public VerificationResponse save(UUID user,VerificationRequest r) {
        UUID creator=access.creatorId(user,true);
        var v=records.findById(creator).orElseGet(()->new IdentityVerification(creator));
        if(v.getStatus()==IdentityVerification.Status.SUBMITTED || v.getStatus()==IdentityVerification.Status.VERIFIED)
            throw new ApiException(HttpStatus.CONFLICT,"Verification has already been submitted. Reopen the page to see its status.");
        boolean submit=r.status().equals("SUBMITTED");
        if(r.step()>v.getStep()+1 || (submit ? r.step()!=4 || v.getStep()!=3 : r.step()==4)) bad("Complete each verification step before continuing.");
        var p=r.personal();
        if(r.step()>=2) {
            if(p.fullName().isBlank() || p.country().isBlank()) bad("Enter your full name and country.");
            try { var date=LocalDate.parse(p.dateOfBirth()); if(!date.isBefore(LocalDate.now(clock))) bad("Enter a date of birth in the past."); }
            catch(java.time.format.DateTimeParseException error) { bad("Enter a valid date of birth in the past."); }
        }
        if(r.step()>=3 && (r.documentType().isEmpty() || !r.documentSelected())) bad("Select an identification type and a sample document.");
        if(submit && !r.selfieSelected()) bad("Select a sample selfie before submitting.");
        v.progress(r.step(),p.fullName().trim(),p.dateOfBirth(),p.country().trim(),r.documentType());
        if(submit) v.submit(clock.instant());
        return response(records.saveAndFlush(v));
    }
    @Override @Transactional public VerificationResponse approveDemo(UUID user) {
        if(!demo) throw new ApiException(HttpStatus.FORBIDDEN,"Simulated approval is disabled in this environment.");
        UUID creator=access.creatorId(user,true);
        var v=records.findById(creator).orElseThrow(()->new ApiException(HttpStatus.CONFLICT,"Submit verification before simulating approval."));
        if(v.getStatus()!=IdentityVerification.Status.SUBMITTED) throw new ApiException(HttpStatus.CONFLICT,"Submit verification before simulating approval.");
        v.approve(clock.instant()); records.flush(); return response(v);
    }
    private VerificationResponse response(IdentityVerification v) { return VerificationResponse.from(v,demo); }
    private void bad(String message) { throw new ApiException(HttpStatus.BAD_REQUEST,message); }
}
