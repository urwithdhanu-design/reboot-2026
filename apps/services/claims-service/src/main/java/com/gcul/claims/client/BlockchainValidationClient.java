package com.gcul.claims.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClient.RequestHeadersSpec;
import org.springframework.web.server.ResponseStatusException;

@Component
public class BlockchainValidationClient {

	private static final String INTERNAL_KEY_HEADER = "X-Gcul-Internal-Key";

	private static final Logger log = LoggerFactory.getLogger(BlockchainValidationClient.class);

	private final RestClient restClient;
	private final String internalApiKey;

	public BlockchainValidationClient(
			@Value("${gcul.blockchain-service.url:http://127.0.0.1:8088}") String baseUrl,
			@Value("${gcul.internal-api.key:}") String internalApiKey) {
		this.restClient = RestClient.builder().baseUrl(baseUrl).build();
		this.internalApiKey = internalApiKey == null ? "" : internalApiKey.trim();
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> verifyCantonPolicy(String policyId, String policyReferenceHash) {
		try {
			Map<String, Object> response = withInternalAuth(restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/blockchain/internal/policy-nft/{policyId}/verify")
							.queryParam("policyReferenceHash", policyReferenceHash)
							.build(policyId)))
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
			Map<String, Object> response = withInternalAuth(restClient.get()
					.uri("/api/blockchain/internal/policy-nft/{policyId}", policyId))
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

		String ledgerMode = resolveLedgerMode(verification, policy);
		if ("simulated".equalsIgnoreCase(ledgerMode)) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Policy was minted on simulated ledger — not Canton verified. Re-mint on Canton before filing claims.");
		}

		String reason = verification.get("reason") == null
				? "Policy certificate not found on Canton ledger"
				: String.valueOf(verification.get("reason"));
		throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, reason);
	}

	public void assertVerifiedOnCanton(Map<String, Object> verification) {
		assertVerifiedOnCanton(verification, Map.of());
	}

	private static String resolveLedgerMode(Map<String, Object> verification, Map<String, Object> policy) {
		String fromVerify = firstNonBlank(
				str(verification.get("ledger_mode")),
				str(verification.get("ledgerMode")),
				str(verification.get("ledgerId")),
				str(verification.get("ledger")));
		if (!fromVerify.isBlank()) {
			return fromVerify.toLowerCase();
		}
		return firstNonBlank(
				str(policy.get("ledger_mode")),
				str(policy.get("ledger_type")),
				str(policy.get("primary_ledger_id")),
				"canton");
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
			Map<String, Object> response = withInternalAuth(restClient.post()
					.uri("/api/blockchain/internal/claims/settle")
					.body(body))
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

	private <T extends RequestHeadersSpec<?>> T withInternalAuth(T spec) {
		if (StringUtils.hasText(internalApiKey)) {
			return spec.header(INTERNAL_KEY_HEADER, internalApiKey);
		}
		return spec;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank() && !"null".equalsIgnoreCase(value)) {
				return value.trim();
			}
		}
		return "";
	}
}
