package com.gcul.blockchain.gcul;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class GculSidecarClient {

	private final RestClient http;
	private final boolean enabled;
	private final String baseUrl;

	public GculSidecarClient(
			@Value("${gcul.sidecar.enabled:true}") boolean enabled,
			@Value("${gcul.sidecar.url:http://127.0.0.1:8091}") String baseUrl) {
		this.enabled = enabled;
		this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
		this.http = RestClient.create();
	}

	public boolean isEnabled() {
		return enabled;
	}

	public Map<String, Object> health() {
		if (!enabled) {
			return Map.of("status", "disabled", "service", "gcul-sidecar");
		}
		try {
			@SuppressWarnings("unchecked")
			Map<String, Object> body = http.get()
					.uri(baseUrl + "/health")
					.retrieve()
					.body(Map.class);
			return body == null ? Map.of("status", "unknown") : body;
		}
		catch (Exception ex) {
			return Map.of(
					"status", "down",
					"service", "gcul-sidecar",
					"error", ex.getMessage() == null ? "unreachable" : ex.getMessage());
		}
	}

	public Map<String, Object> transfer(Map<String, Object> payload) {
		if (!enabled) {
			return Map.of("mode", "local", "status", "skipped", "message", "GCUL sidecar disabled");
		}
		@SuppressWarnings("unchecked")
		Map<String, Object> body = http.post()
				.uri(baseUrl + "/api/gcul/transfer")
				.body(payload)
				.retrieve()
				.body(Map.class);
		return body == null ? Map.of() : body;
	}
}
