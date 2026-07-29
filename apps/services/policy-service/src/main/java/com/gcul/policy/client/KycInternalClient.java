package com.gcul.policy.client;

import java.util.Map;
import java.util.LinkedHashSet;

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
		return isVerifiedForAny(customerId);
	}

	/** A legacy policy may hold an email or pre-wallet user ID; accept any proven customer identity. */
	@SuppressWarnings("unchecked")
	public boolean isVerifiedForAny(String... customerIdsOrEmails) {
		var candidates = new LinkedHashSet<String>();
		for (String candidate : customerIdsOrEmails) {
			if (StringUtils.hasText(candidate)) candidates.add(candidate.trim());
		}
		for (String candidate : candidates) {
			try {
				Map<String, Object> body = restClient.get()
						.uri(uriBuilder -> uriBuilder
								.path("/api/internal/kyc/status")
								.queryParam("customerId", candidate)
								.build())
						.retrieve()
						.body(Map.class);
				if (body != null && "verified".equalsIgnoreCase(String.valueOf(body.get("status")))) {
					return true;
				}
			}
			catch (Exception ex) {
				log.debug("KYC lookup failed for {}: {}", candidate, ex.getMessage());
			}
		}
		return false;
	}
}
