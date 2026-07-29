package com.gcul.messaging.audit;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

public class AuditHttpClient {

	private static final Logger log = LoggerFactory.getLogger(AuditHttpClient.class);

	private final boolean enabled;
	private final String baseUrl;
	private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
	private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
		Thread t = new Thread(r, "gcul-audit-ingest");
		t.setDaemon(true);
		return t;
	});

	public AuditHttpClient(boolean enabled, String baseUrl) {
		this.enabled = enabled;
		this.baseUrl = baseUrl == null ? "" : baseUrl.trim().replaceAll("/+$", "");
	}

	public void ingestDomainEvent(Map<String, Object> payload) {
		if (!enabled || baseUrl.isBlank()) {
			return;
		}
		Map<String, Object> body = new LinkedHashMap<>(payload);
		executor.execute(() -> post("/api/internal/audit/events", body));
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
				log.debug("Audit ingest {} returned {}", path, code);
			}
			conn.disconnect();
		}
		catch (Exception ex) {
			log.debug("Audit ingest skipped: {}", ex.getMessage());
		}
	}
}
