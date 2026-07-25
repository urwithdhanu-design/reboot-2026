package com.gcul.policy.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Component
public class KycInternalClient {

	private static final Logger log = LoggerFactory.getLogger(KycInternalClient.class);

	private final RestClient restClient;

	public KycInternalClient(@Value("${gcul.kyc-service.url:http://127.0.0.1:8081}") String baseUrl) {
		this.restClient = RestClient.builder().baseUrl(baseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public boolean isVerified(String customerId) {
		if (!StringUtils.hasText(customerId)) {
			return false;
		}
		try {
			Map<String, Object> body = restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/internal/kyc/status")
							.queryParam("customerId", customerId.trim())
							.build())
					.retrieve()
					.body(Map.class);
			return body != null && "verified".equalsIgnoreCase(String.valueOf(body.get("status")));
		}
		catch (Exception ex) {
			log.debug("KYC lookup failed for {}: {}", customerId, ex.getMessage());
			return false;
		}
	}
}
