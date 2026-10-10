package com.ampacash.creatorhub.dto;
import com.ampacash.creatorhub.model.IdentityVerification;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
@JsonInclude(JsonInclude.Include.NON_NULL)
public record VerificationResponse(IdentityVerification.Status status,int step,VerificationRequest.Personal personal,
    String documentType,Instant submittedAt,Instant approvedAt,boolean demoApprovalEnabled) {
    @Override public String toString() { return "VerificationResponse[redacted]"; }
    public static VerificationResponse from(IdentityVerification v,boolean demo) {
        return new VerificationResponse(v.getStatus(),v.getStep(),new VerificationRequest.Personal(v.getFullName(),v.getDateOfBirth(),v.getCountry()),v.getDocumentType(),v.getSubmittedAt(),v.getApprovedAt(),demo);
    }
}
