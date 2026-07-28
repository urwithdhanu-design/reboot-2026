package com.gcul.policy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.policy.model.PolicyLedgerAttestation;
import com.gcul.policy.model.PolicyLedgerAttestationId;

public interface PolicyLedgerAttestationRepository
		extends JpaRepository<PolicyLedgerAttestation, PolicyLedgerAttestationId> {

	Optional<PolicyLedgerAttestation> findByPolicyIdAndLedgerId(String policyId, String ledgerId);

	List<PolicyLedgerAttestation> findByPolicyIdOrderByAttestedAtDesc(String policyId);
}
