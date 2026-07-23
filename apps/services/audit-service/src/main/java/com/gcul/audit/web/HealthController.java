package com.gcul.audit.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

	@Value("${gcul.runtime.mode:local}")
	private String runtimeMode;

	@GetMapping("/health")
	public Map<String, Object> health() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("status", "ok");
		body.put("service", "audit-service");
		body.put("runtimeMode", runtimeMode);
		return body;
	}
}
