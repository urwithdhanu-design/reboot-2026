package com.gcul.blockchain.ledger;

import java.util.Map;
import java.util.Optional;

import com.gcul.blockchain.ethereum.PolicyNftMintResult;
import com.gcul.blockchain.ethereum.PolicyNftMintService.MintRequest;

/**
 * Pluggable ledger backend for policy NFT minting and verification.
 * Phase 1 selects one primary adapter; secondary ledgers are reserved for async mirror (Phase 2).
 */
public interface LedgerAdapter {

	/** Stable ledger identifier: {@code canton}, {@code ethereum}, or {@code simulated}. */
	String ledgerId();

	boolean isActive();

	Map<String, Object> status();

	PolicyNftMintResult mint(MintRequest request);

	/**
	 * Optional on-ledger verification. Claims verification in policy/claims services
	 * should use the primary attestation stored in {@code policy_ledger_attestations}.
	 */
	Optional<Map<String, Object>> verify(String policyId, String policyReferenceHash);
}
