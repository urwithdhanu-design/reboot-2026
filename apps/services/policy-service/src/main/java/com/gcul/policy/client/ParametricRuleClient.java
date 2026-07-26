package com.gcul.policy.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ParametricRuleClient {

	private static final Logger log = LoggerFactory.getLogger(ParametricRuleClient.class);

	private final RestClient restClient;

	public ParametricRuleClient(
			@Value("${gcul.parametric-service.url:http://127.0.0.1:8086}") String baseUrl) {
		this.restClient = RestClient.builder()
				.baseUrl(baseUrl)
				.build();
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> createRule(Map<String, Object> body) {
		try {
			return restClient.post()
					.uri("/api/parametric/rules")
					.body(body)
					.retrieve()
					.body(Map.class);
		}
		catch (Exception ex) {
			log.warn("Parametric rule creation failed: {}", ex.getMessage());
			throw ex;
		}
	}
}
