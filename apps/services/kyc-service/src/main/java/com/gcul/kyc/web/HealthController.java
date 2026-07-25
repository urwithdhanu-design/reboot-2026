package com.gcul.kyc.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.kyc.mail.MailService;

@RestController
public class HealthController {

	private final MailService mail;

	@Value("${gcul.runtime.mode:local}")
	private String runtimeMode;

	@Value("${gcul.cloud-sql.enabled:false}")
	private boolean cloudSqlEnabled;

	public HealthController(MailService mail) {
		this.mail = mail;
	}

	@GetMapping("/health")
	public Map<String, Object> health() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("status", "ok");
		body.put("service", "kyc-service");
		body.put("runtimeMode", runtimeMode);
		body.put("database", cloudSqlEnabled ? "cloud-sql-postgresql" : "h2");
		body.put("mail", mail.isReady() ? "configured" : "not_configured");
		return body;
	}
}
