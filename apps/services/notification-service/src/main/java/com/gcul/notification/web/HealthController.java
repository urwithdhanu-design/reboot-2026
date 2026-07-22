package com.gcul.notification.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

	@Value("${gcul.runtime.mode:local}")
	private String runtimeMode;

	@Value("${gcul.cloud-sql.enabled:false}")
	private boolean cloudSqlEnabled;

	@GetMapping("/health")
	public Map<String, Object> health() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("status", "ok");
		body.put("service", "notification-service");
		body.put("runtimeMode", runtimeMode);
		body.put("database", cloudSqlEnabled ? "cloud-sql-postgresql" : "h2");
		return body;
	}
}
