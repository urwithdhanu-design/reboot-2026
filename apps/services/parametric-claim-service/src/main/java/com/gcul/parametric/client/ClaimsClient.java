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
public class ClaimsClient {

	private static final Logger log = LoggerFactory.getLogger(ClaimsClient.class);

	private final RestClient restClient;

	public ClaimsClient(@Value("${gcul.claims-service.url:http://127.0.0.1:8085}") String baseUrl) {
		this.restClient = RestClient.builder().baseUrl(baseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> createParametricAutoSettle(Map<String, Object> claimBody) {
		try {
			Map<String, Object> response = restClient.post()
					.uri("/api/internal/claims/parametric")
					.contentType(MediaType.APPLICATION_JSON)
					.body(claimBody)
					.retrieve()
					.body(Map.class);
			return response == null ? Map.of() : response;
		}
		catch (Exception ex) {
			log.error("Parametric auto-settle claim failed: {}", ex.getMessage());
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Claims auto-settlement failed: " + ex.getMessage());
		}
	}

	public Map<String, Object> buildClaimRequest(
			String policyRef,
			String customerName,
			String customerEmail,
			String customerId,
			double amount,
			String description,
			String category,
			String walletAddress,
			String parametricEventType) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("policy_ref", policyRef);
		body.put("customer_name", customerName);
		if (customerEmail != null && !customerEmail.isBlank()) {
			body.put("customer_email", customerEmail);
		}
		if (customerId != null && !customerId.isBlank()) {
			body.put("customer_id", customerId);
		}
		if (walletAddress != null && !walletAddress.isBlank()) {
			body.put("wallet_address", walletAddress);
		}
		body.put("amount_claimed", amount);
		body.put("description", description);
		body.put("category", category);
		body.put("source", "parametric");
		body.put("auto_settle", true);
		if (parametricEventType != null && !parametricEventType.isBlank()) {
			body.put("parametric_event_type", parametricEventType);
		}
		return body;
	}
}
