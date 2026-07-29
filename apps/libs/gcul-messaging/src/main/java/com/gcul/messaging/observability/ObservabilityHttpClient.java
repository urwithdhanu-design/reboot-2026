package com.gcul.messaging.observability;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

public class ObservabilityHttpClient {

	private static final Logger log = LoggerFactory.getLogger(ObservabilityHttpClient.class);

	private final boolean enabled;
	private final String baseUrl;
	private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
	private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
		Thread t = new Thread(r, "gcul-observability-ingest");
		t.setDaemon(true);
		return t;
	});

	public ObservabilityHttpClient(boolean enabled, String baseUrl) {
		this.enabled = enabled;
		this.baseUrl = baseUrl == null ? "" : baseUrl.trim().replaceAll("/+$", "");
	}

	public void ingestApiTrace(Map<String, Object> payload) {
		if (!enabled || baseUrl.isBlank()) {
			return;
		}
		executor.execute(() -> post("/api/internal/observability/traces", payload));
	}

	public void ingestDomainEvent(Map<String, Object> payload) {
		if (!enabled || baseUrl.isBlank()) {
			return;
		}
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("event_type", first(payload, "eventType", "event_type"));
		body.put("source_event_type", first(payload, "sourceEventType", "source_event_type"));
		body.put("source_publisher", first(payload, "sourcePublisher", "source_publisher"));
		body.put("source_topic", first(payload, "sourceTopic", "source_topic"));
		body.put("flow_category", flowFor(String.valueOf(body.get("source_event_type"))));
		body.put("customer_id", first(payload, "customerId", "customer_id"));
		body.put("policy_id", first(payload, "policyId", "policy_id", "policyRef", "policy_ref"));
		body.put("claim_id", first(payload, "claimId", "claim_id"));
		body.put("quote_id", first(payload, "quoteId", "quote_id"));
		body.put("event_id", first(payload, "eventId", "event_id"));
		body.put("timestamp", first(payload, "timestamp"));
		body.put("payload", payload);
		executor.execute(() -> post("/api/internal/observability/events", body));
	}

	private void post(String path, Map<String, Object> payload) {
		try {
			byte[] json = mapper.writeValueAsBytes(payload);
			var conn = (java.net.HttpURLConnection) URI.create(baseUrl + path).toURL().openConnection();
			conn.setRequestMethod("POST");
			conn.setConnectTimeout(2000);
			conn.setReadTimeout(3000);
			conn.setDoOutput(true);
			conn.setRequestProperty("Content-Type", "application/json");
			conn.getOutputStream().write(json);
			int code = conn.getResponseCode();
			if (code >= 400) {
				log.debug("Observability ingest {} returned {}", path, code);
			}
			conn.disconnect();
		}
		catch (Exception ex) {
			log.debug("Observability ingest skipped: {}", ex.getMessage());
		}
	}

	private static String first(Map<String, Object> map, String... keys) {
		for (String key : keys) {
			Object value = map.get(key);
			if (value != null && !String.valueOf(value).isBlank()) {
				return String.valueOf(value).trim();
			}
		}
		return "";
	}

	private static String flowFor(String eventType) {
		if (eventType == null || eventType.isBlank()) {
			return "system";
		}
		String key = eventType.trim();
		if (key.startsWith("Customer") || key.startsWith("Kyc")) {
			return "kyc";
		}
		if (key.startsWith("Wallet")) {
			return "wallet";
		}
		if (key.startsWith("Policy")) {
			return "policy";
		}
		if (key.startsWith("Premium") || key.equals("ClaimPaid")) {
			return "payment";
		}
		if (key.startsWith("Claim") || key.startsWith("Parametric")) {
			return "claims";
		}
		return "system";
	}
}
