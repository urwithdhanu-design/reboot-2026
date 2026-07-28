package com.gcul.claims.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
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
		String status = str(policy.get("status"));
		if ("cancelled".equalsIgnoreCase(status)) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Policy has been cancelled — new claims cannot be filed");
		}
		String mintStatus = str(policy.get("mint_status"));
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
		if (Boolean.TRUE.equals(policy.get("coverage_pending_mint"))) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Policy cover is not active yet — cover starts when the policy is minted");
		}
		if (!Boolean.TRUE.equals(policy.get("coverage_active"))
				&& str(policy.get("cover_start_at")).isBlank()) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Policy cover has not started — wait for mint approval to complete");
		}
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> consumeCoverage(String policyRef, double amount) {
		try {
			Map<String, Object> response = restClient.post()
					.uri("/api/internal/policies/{policyId}/coverage/consume", policyRef)
					.contentType(MediaType.APPLICATION_JSON)
					.body(Map.of("amount", amount))
					.retrieve()
					.body(Map.class);
			return response == null ? Map.of() : response;
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (Exception ex) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Could not update remaining policy coverage: " + ex.getMessage());
		}
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
