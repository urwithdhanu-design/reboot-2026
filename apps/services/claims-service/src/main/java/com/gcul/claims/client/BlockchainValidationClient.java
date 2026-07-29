package com.gcul.claims.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Component
public class BlockchainValidationClient {

	private static final Logger log = LoggerFactory.getLogger(BlockchainValidationClient.class);

	private final RestClient restClient;

	public BlockchainValidationClient(@Value("${gcul.blockchain-service.url:http://127.0.0.1:8088}") String baseUrl) {
		this.restClient = RestClient.builder().baseUrl(baseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> verifyCantonPolicy(String policyId, String policyReferenceHash) {
		try {
			Map<String, Object> response = restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/blockchain/internal/policy-nft/{policyId}/verify")
							.queryParam("policyReferenceHash", policyReferenceHash)
							.build(policyId))
					.retrieve()
					.body(Map.class);
			return response == null ? Map.of("verified", false) : response;
		}
		catch (Exception ex) {
			log.warn("Canton policy verification failed for {}: {}", policyId, ex.getMessage());
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Cannot verify policy on Canton ledger: " + ex.getMessage());
		}
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> fetchMintRecord(String policyId) {
		try {
			Map<String, Object> response = restClient.get()
					.uri("/api/blockchain/internal/policy-nft/{policyId}", policyId)
					.retrieve()
					.body(Map.class);
			return response == null ? Map.of() : response;
		}
		catch (Exception ex) {
			log.debug("Mint record lookup failed for {}: {}", policyId, ex.getMessage());
			return Map.of();
		}
	}

	public void assertVerifiedOnCanton(Map<String, Object> verification, Map<String, Object> policy) {
		if (Boolean.TRUE.equals(verification.get("verified"))) {
			return;
		}
		String mintStatus = policy == null ? "" : String.valueOf(policy.getOrDefault("mint_status", ""));
		String tokenId = policy == null ? "" : String.valueOf(policy.getOrDefault("token_id", ""));
		if ("MINTED".equalsIgnoreCase(mintStatus) && tokenId != null && !tokenId.isBlank() && !"null".equals(tokenId)) {
			return;
		}
		String reason = verification.get("reason") == null
				? "Policy certificate not found on Canton ledger"
				: String.valueOf(verification.get("reason"));
		throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, reason);
	}

	public void assertVerifiedOnCanton(Map<String, Object> verification) {
		assertVerifiedOnCanton(verification, Map.of());
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> settleClaim(String claimId, String policyRef, double amount, String customerId,
			String walletAddress, String source, double coverageLimit, double coverageRemaining) {
		try {
			Map<String, Object> body = Map.of(
					"claim_id", claimId,
					"policy_ref", policyRef,
					"amount", amount,
					"customer_id", customerId == null ? "" : customerId,
					"wallet_address", walletAddress == null ? "" : walletAddress,
					"source", source == null ? "manual" : source,
					"to_wallet", "gcul:customer:" + (customerId == null ? "unknown" : customerId),
					"coverage_limit_gbp", coverageLimit,
					"coverage_remaining_gbp", coverageRemaining);
			Map<String, Object> response = restClient.post()
					.uri("/api/blockchain/internal/claims/settle")
					.body(body)
					.retrieve()
					.body(Map.class);
			return response == null ? Map.of() : response;
		}
		catch (Exception ex) {
			log.warn("Blockchain claim settlement failed for {}: {}", claimId, ex.getMessage());
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Blockchain settlement failed: " + ex.getMessage());
		}
	}
}
