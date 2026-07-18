package com.gcul.claims.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.claims.model.InsuranceClaim;

public interface ClaimRepository extends JpaRepository<InsuranceClaim, String> {
	List<InsuranceClaim> findAllByOrderByCreatedAtDesc();
	List<InsuranceClaim> findByStatusOrderByCreatedAtDesc(String status);
}
