package com.gcul.wallet.client;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Component
public class KycStatusClient {

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
}
