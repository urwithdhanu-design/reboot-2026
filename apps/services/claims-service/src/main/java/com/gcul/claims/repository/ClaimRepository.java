package com.gcul.claims.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gcul.claims.model.InsuranceClaim;

public interface ClaimRepository extends JpaRepository<InsuranceClaim, String> {
	List<InsuranceClaim> findAllByOrderByCreatedAtDesc();
	List<InsuranceClaim> findByStatusOrderByCreatedAtDesc(String status);

	@Query("""
			SELECT COALESCE(SUM(COALESCE(c.approvedAmount, c.amountClaimed)), 0)
			FROM InsuranceClaim c
			WHERE c.policyRef = :policyRef AND c.status IN :statuses
			""")
	double sumReservedAmountForPolicy(@Param("policyRef") String policyRef, @Param("statuses") List<String> statuses);
}
