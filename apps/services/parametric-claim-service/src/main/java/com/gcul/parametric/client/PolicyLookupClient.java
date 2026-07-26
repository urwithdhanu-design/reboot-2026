package com.gcul.parametric.client;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Component
public class PolicyLookupClient {

	private static final Logger log = LoggerFactory.getLogger(PolicyLookupClient.class);

	private final RestClient restClient;

	public PolicyLookupClient(@Value("${gcul.policy-service.url:http://127.0.0.1:8082}") String baseUrl) {
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
					"Policy service unavailable");
		}
	}

	public void assertEligibleForParametricClaim(Map<String, Object> policy, String travelDate, String policyExpiresAt) {
		String mintStatus = str(policy.get("mint_status"));
		if (!"MINTED".equalsIgnoreCase(mintStatus)) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Policy is not minted on Canton — parametric claim requires on-chain certificate");
		}
		String status = str(policy.get("status"));
		if (!"active".equalsIgnoreCase(status) && !"issued".equalsIgnoreCase(status)) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Policy is not active");
		}
		if (!policyExpiresAt.isBlank() && Instant.now().isAfter(Instant.parse(policyExpiresAt))) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Policy coverage expired on " + policyExpiresAt);
		}
		if (!travelDate.isBlank() && !policyExpiresAt.isBlank()) {
			try {
				Instant travel = Instant.parse(travelDate + "T12:00:00Z");
				Instant expires = Instant.parse(policyExpiresAt);
				if (travel.isAfter(expires)) {
					throw new ResponseStatusException(
							org.springframework.http.HttpStatus.BAD_REQUEST,
							"Travel date is after policy expiry");
				}
			}
			catch (ResponseStatusException ex) {
				throw ex;
			}
			catch (Exception ex) {
				log.debug("Date parse skipped: {}", ex.getMessage());
			}
		}
	}

	public static String derivePolicyExpiry(Map<String, Object> policy) {
		String activated = str(policy.get("activated_at"));
		if (!activated.isBlank()) {
			try {
				return Instant.parse(activated).plus(365, ChronoUnit.DAYS).toString();
			}
			catch (Exception ignored) {
				// fall through
			}
		}
		String issued = str(policy.get("issued_at"));
		if (!issued.isBlank()) {
			try {
				return Instant.parse(issued).plus(365, ChronoUnit.DAYS).toString();
			}
			catch (Exception ignored) {
				// fall through
			}
		}
		return Instant.now().plus(365, ChronoUnit.DAYS).toString();
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
