package com.gcul.blockchain.ledger;

import java.util.Map;

public record MintRequest(
		String policyId, String policyNumber, String customerId, String walletAddress,
		String policyReferenceHash, String metadataUri, boolean kycVerified,
		boolean policyEligible, Map<String, Object> metadata) {
}
