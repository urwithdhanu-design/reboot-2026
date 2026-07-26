package com.gcul.policy.client;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class BlockchainMintClient {

	private static final Logger log = LoggerFactory.getLogger(BlockchainMintClient.class);

	private final RestClient restClient;

	public BlockchainMintClient(@Value("${gcul.blockchain-service.url:http://127.0.0.1:8088}") String baseUrl) {
		this.restClient = RestClient.builder()
				.baseUrl(baseUrl)
				.build();
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> mintPolicyNft(Map<String, Object> request) {
		try {
			Map<String, Object> response = restClient.post()
					.uri("/api/blockchain/internal/policy-nft/mint")
					.contentType(MediaType.APPLICATION_JSON)
					.body(request)
					.retrieve()
					.onStatus(HttpStatusCode::isError, (req, res) -> {
						String body = res.getBody() == null
								? ""
								: new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
						log.warn("Blockchain mint API returned {} for policy {}: {}",
								res.getStatusCode(), request.get("policyId"), body);
						throw new RestClientException(
								body.isBlank() ? "Blockchain mint failed: " + res.getStatusCode() : body);
					})
					.body(Map.class);
			log.info("Blockchain mint completed for policy {} tokenId={}",
					request.get("policyId"), response == null ? null : response.get("tokenId"));
			return response == null ? Map.of() : response;
		}
		catch (Exception ex) {
			log.error("Blockchain mint API call failed for policy {}: {}",
					request.get("policyId"), ex.getMessage());
			throw ex;
		}
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> fetchNftStatus() {
		try {
			Map<String, Object> response = restClient.get()
					.uri("/api/blockchain/internal/policy-nft/status")
					.retrieve()
					.body(Map.class);
			return response == null ? Map.of() : response;
		}
		catch (Exception ex) {
			log.debug("Blockchain status lookup failed: {}", ex.getMessage());
			return Map.of(
					"network", "Canton Local Sandbox",
					"chainId", 0L,
					"mode", "canton-offline",
					"live", false,
					"enabled", false);
		}
	}

	public Map<String, Object> buildMintRequest(PolicyRecordView policy, boolean kycVerified) {
		Map<String, Object> request = new LinkedHashMap<>();
		request.put("policyId", policy.policyId());
		request.put("policyNumber", policy.policyNumber());
		request.put("customerId", policy.customerId());
		request.put("walletAddress", policy.walletAddress());
		request.put("policyReferenceHash", policy.policyReferenceHash());
		request.put("metadataURI", policy.metadataUri());
		request.put("kycVerified", kycVerified);
		request.put("policyEligible", true);
		Map<String, Object> metadata = new LinkedHashMap<>();
		metadata.put("productTitle", policy.productTitle() == null ? "" : policy.productTitle());
		metadata.put("quoteId", policy.quoteId());
		metadata.put("source", "policy-service");
		if (policy.productCategory() != null && !policy.productCategory().isBlank()) {
			metadata.put("productCategory", policy.productCategory());
		}
		if (policy.coverageSummary() != null && !policy.coverageSummary().isBlank()) {
			metadata.put("coverageSummary", policy.coverageSummary());
		}
		if (policy.coverExpiresAt() != null && !policy.coverExpiresAt().isBlank()) {
			metadata.put("coverExpiresAt", policy.coverExpiresAt());
		}
		if (policy.coverageLimitGbp() != null) {
			metadata.put("coverageLimitGbp", policy.coverageLimitGbp());
		}
		request.put("metadata", metadata);
		return request;
	}

	public record PolicyRecordView(
			String policyId,
			String policyNumber,
			String quoteId,
			String customerId,
			String walletAddress,
			String policyReferenceHash,
			String metadataUri,
			String productTitle,
			String productCategory,
			String coverageSummary,
			String coverExpiresAt,
			Double coverageLimitGbp) {
	}
}
