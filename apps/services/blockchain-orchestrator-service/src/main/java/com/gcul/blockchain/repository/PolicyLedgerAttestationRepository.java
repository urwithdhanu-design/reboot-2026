package com.gcul.blockchain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.blockchain.model.PolicyLedgerAttestation;
import com.gcul.blockchain.model.PolicyLedgerAttestationId;

public interface PolicyLedgerAttestationRepository
		extends JpaRepository<PolicyLedgerAttestation, PolicyLedgerAttestationId> {

	Optional<PolicyLedgerAttestation> findByPolicyIdAndLedgerId(String policyId, String ledgerId);

	Optional<PolicyLedgerAttestation> findByPolicyReferenceHashAndLedgerId(String policyReferenceHash, String ledgerId);

	List<PolicyLedgerAttestation> findByPolicyIdOrderByMintedAtDesc(String policyId);

	List<PolicyLedgerAttestation> findTop20ByOrderByMintedAtDesc();
}
