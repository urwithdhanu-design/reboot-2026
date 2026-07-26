package com.gcul.claims.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Component
public class PolicyValidationClient {

	private static final Logger log = LoggerFactory.getLogger(PolicyValidationClient.class);

	private final RestClient restClient;

	public PolicyValidationClient(@Value("${gcul.policy-service.url:http://127.0.0.1:8082}") String baseUrl) {
		this.restClient = RestClient.builder().baseUrl(baseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> fetchPolicy(String policyRef) {
		try {
			return restClient.get()
					.uri("/api/internal/policies/{policyId}", policyRef)
					.retrieve()
					.onStatus(HttpStatusCode::isError, (req, res) -> {
						throw new ResponseStatusException(
								org.springframework.http.HttpStatus.BAD_REQUEST,
								"Policy not found: " + policyRef);
					})
					.body(Map.class);
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (Exception ex) {
			log.warn("Policy lookup failed for {}: {}", policyRef, ex.getMessage());
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Policy service unavailable — cannot validate policy");
		}
	}

	public void assertEligibleForClaim(Map<String, Object> policy) {
		String mintStatus = str(policy.get("mint_status"));
		String status = str(policy.get("status"));
		if (!"MINTED".equalsIgnoreCase(mintStatus)) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Policy is not minted on Canton — mint must complete before filing a claim");
		}
		if (!"active".equalsIgnoreCase(status) && !"issued".equalsIgnoreCase(status)) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Policy is not active — status: " + status);
		}
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
