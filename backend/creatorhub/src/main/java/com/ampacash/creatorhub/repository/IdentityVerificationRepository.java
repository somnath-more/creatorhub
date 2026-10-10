package com.ampacash.creatorhub.repository;
import com.ampacash.creatorhub.model.IdentityVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface IdentityVerificationRepository extends JpaRepository<IdentityVerification,UUID> {}
