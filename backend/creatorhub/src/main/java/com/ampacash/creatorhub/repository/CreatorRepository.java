package com.ampacash.creatorhub.repository;

import com.ampacash.creatorhub.model.Creator;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface CreatorRepository extends JpaRepository<Creator, UUID> {}
