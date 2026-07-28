package com.gcul.policy.client;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ClaimsInternalClient {

	private static final Logger log = LoggerFactory.getLogger(ClaimsInternalClient.class);

	private final RestClient restClient;

	public ClaimsInternalClient(@Value("${gcul.claims-service.url:http://127.0.0.1:8085}") String baseUrl) {
		this.restClient = RestClient.builder().baseUrl(baseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public int countOpenClaims(String policyRef) {
		try {
			Map<String, Object> response = restClient.get()
					.uri("/api/internal/claims/by-policy/{policyRef}?open=true", policyRef)
					.retrieve()
					.body(Map.class);
			if (response == null) {
				return 0;
			}
			Object count = response.get("open_count");
			if (count instanceof Number number) {
				return number.intValue();
			}
			Object claims = response.get("claims");
			if (claims instanceof List<?> list) {
				return list.size();
			}
			return 0;
		}
		catch (Exception ex) {
			log.warn("Could not check open claims for {}: {}", policyRef, ex.getMessage());
			return 0;
		}
	}
}
