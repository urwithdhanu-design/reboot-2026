package com.gcul.parametric.client;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Component
public class BlockchainClient {

	private static final Logger log = LoggerFactory.getLogger(BlockchainClient.class);

	private final RestClient restClient;

	public BlockchainClient(@Value("${gcul.blockchain-service.url:http://127.0.0.1:8088}") String baseUrl) {
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
			log.warn("Canton verify failed for {}: {}", policyId, ex.getMessage());
			return Map.of("verified", false, "reason", ex.getMessage());
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
				? "Policy not verified on Canton ledger"
				: String.valueOf(verification.get("reason"));
		throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, reason);
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> recordClaimInitiated(Map<String, Object> payload) {
		try {
			Map<String, Object> response = restClient.post()
					.uri("/api/blockchain/internal/claims/parametric-initiated")
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.body(Map.class);
			return response == null ? Map.of() : response;
		}
		catch (Exception ex) {
			log.warn("Failed to record parametric claim on chain: {}", ex.getMessage());
			return Map.of("status", "local_only", "error", ex.getMessage());
		}
	}
}
