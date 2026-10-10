package com.ampacash.creatorhub.model;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="identity_verifications")
public class IdentityVerification {
    public enum Status { NOT_STARTED, IN_PROGRESS, SUBMITTED, VERIFIED }
    @Id @Column(name="creator_id") private UUID creatorId;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private Status status=Status.NOT_STARTED;
    private int step=1;
    @Column(name="full_name",nullable=false,length=100) private String fullName="";
    @Column(name="date_of_birth",nullable=false,length=10) private String dateOfBirth="";
    @Column(nullable=false,length=80) private String country="";
    @Column(name="document_type",nullable=false,length=20) private String documentType="";
    @Column(name="submitted_at") private Instant submittedAt;
    @Column(name="approved_at") private Instant approvedAt;
    protected IdentityVerification() {}
    public IdentityVerification(UUID creatorId) { this.creatorId=creatorId; }
    public void progress(int step,String name,String birth,String country,String document) {
        status=Status.IN_PROGRESS; this.step=step; fullName=name; dateOfBirth=birth; this.country=country; documentType=document;
    }
    public void submit(Instant now) { status=Status.SUBMITTED; step=4; submittedAt=now; }
    public void approve(Instant now) { status=Status.VERIFIED; approvedAt=now; }
    public Status getStatus(){return status;} public int getStep(){return step;}
    public String getFullName(){return fullName;} public String getDateOfBirth(){return dateOfBirth;}
    public String getCountry(){return country;} public String getDocumentType(){return documentType;}
    public Instant getSubmittedAt(){return submittedAt;} public Instant getApprovedAt(){return approvedAt;}
}
