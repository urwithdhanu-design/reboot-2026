package com.gcul.wallet.client;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Component
public class KycStatusClient {

	private static final Logger log = LoggerFactory.getLogger(KycStatusClient.class);

	private final RestClient restClient;

	public KycStatusClient(@Value("${gcul.kyc-service.url}") String kycBaseUrl) {
		this.restClient = RestClient.builder().baseUrl(kycBaseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public String fetchKycStatus(String bearerToken) {
		try {
			Map<String, Object> body = restClient.get()
					.uri("/api/kyc/status")
					.header("Authorization", "Bearer " + bearerToken)
					.retrieve()
					.body(Map.class);
			if (body == null || !body.containsKey("status")) {
				return "not_started";
			}
			return String.valueOf(body.get("status"));
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not verify KYC status");
		}
	}

	/** Registered account email and display name from kyc-service (source of truth). */
	@SuppressWarnings("unchecked")
	public Map<String, String> fetchAccountProfile(String bearerToken) {
		try {
			Map<String, Object> body = restClient.get()
					.uri("/api/auth/me")
					.header("Authorization", "Bearer " + bearerToken)
					.retrieve()
					.body(Map.class);
			if (body == null) {
				return Map.of();
			}
			String email = body.get("email") == null
					? ""
					: String.valueOf(body.get("email")).trim().toLowerCase(Locale.ROOT);
			if (email.isBlank()) {
				return Map.of();
			}
			String fullName = body.get("full_name") == null
					? ""
					: String.valueOf(body.get("full_name")).trim();
			Map<String, String> profile = new HashMap<>();
			profile.put("email", email);
			profile.put("full_name", fullName.isBlank() ? email : fullName);
			return profile;
		}
		catch (Exception ex) {
			log.warn("Could not fetch account profile from kyc-service: {}", ex.getMessage());
			return Map.of();
		}
	}
}
