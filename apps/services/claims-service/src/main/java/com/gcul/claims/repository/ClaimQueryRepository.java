package com.gcul.claims.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.claims.model.ClaimQuery;

public interface ClaimQueryRepository extends JpaRepository<ClaimQuery, String> {
	List<ClaimQuery> findByClaimIdOrderByCreatedAtAsc(String claimId);
	long countByClaimIdAndStatus(String claimId, String status);
	Optional<ClaimQuery> findByIdAndClaimId(String id, String claimId);
}
