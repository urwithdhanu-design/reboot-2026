package com.gcul.blockchain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.blockchain.model.PolicyNftRecord;

public interface PolicyNftRecordRepository extends JpaRepository<PolicyNftRecord, String> {

	Optional<PolicyNftRecord> findByPolicyId(String policyId);

	Optional<PolicyNftRecord> findByPolicyReferenceHash(String policyReferenceHash);

	List<PolicyNftRecord> findTop20ByOrderByMintedAtDesc();
}
