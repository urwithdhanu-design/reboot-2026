package com.gcul.claims.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.claims.model.ClaimDocument;

public interface ClaimDocumentRepository extends JpaRepository<ClaimDocument, String> {
	List<ClaimDocument> findByClaimIdOrderByUploadedAtAsc(String claimId);
	long countByClaimId(String claimId);
	Optional<ClaimDocument> findByIdAndClaimId(String id, String claimId);
	long countByClaimIdAndQueryId(String claimId, String queryId);
}
