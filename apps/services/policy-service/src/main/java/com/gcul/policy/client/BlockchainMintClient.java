package com.gcul.policy.client;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

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
						log.warn("Blockchain mint API returned {} for policy {}", res.getStatusCode(),
								request.get("policyId"));
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

	public Map<String, Object> buildMintRequest(
			String policyId,
			String policyNumber,
			String customerId,
			String walletAddress,
			String productTitle) {
		Map<String, Object> request = new LinkedHashMap<>();
		request.put("policyId", policyId);
		request.put("policyNumber", policyNumber);
		request.put("customerId", customerId);
		request.put("walletAddress", walletAddress);
		request.put("metadata", Map.of(
				"productTitle", productTitle == null ? "" : productTitle,
				"source", "policy-service"));
		return request;
	}
}
