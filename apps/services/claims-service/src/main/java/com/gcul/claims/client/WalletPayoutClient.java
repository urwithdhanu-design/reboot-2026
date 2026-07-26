package com.gcul.claims.client;

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
public class WalletPayoutClient {

	private static final Logger log = LoggerFactory.getLogger(WalletPayoutClient.class);

	private final RestClient restClient;

	public WalletPayoutClient(@Value("${gcul.wallet-service.url:http://127.0.0.1:8089}") String baseUrl) {
		this.restClient = RestClient.builder().baseUrl(baseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> creditClaimPayout(
			String customerId,
			String email,
			String walletAddress,
			String claimId,
			double amount) {
		Map<String, Object> body = new LinkedHashMap<>();
		if (customerId != null && !customerId.isBlank()) {
			body.put("customerId", customerId.trim());
		}
		if (email != null && !email.isBlank()) {
			body.put("email", email.trim().toLowerCase());
		}
		if (walletAddress != null && !walletAddress.isBlank()) {
			body.put("walletAddress", walletAddress.trim().toLowerCase());
		}
		body.put("claimId", claimId);
		body.put("amount", amount);
		try {
			Map<String, Object> response = restClient.post()
					.uri("/api/internal/wallet/credit-claim")
					.contentType(MediaType.APPLICATION_JSON)
					.body(body)
					.retrieve()
					.body(Map.class);
			return response == null ? Map.of() : response;
		}
		catch (Exception ex) {
			log.error("Wallet claim credit failed for {}: {}", claimId, ex.getMessage());
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Wallet payout failed: " + ex.getMessage());
		}
	}
}
