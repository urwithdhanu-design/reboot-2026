package com.gcul.blockchain.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.blockchain.service.BlockchainOrchestratorService;

@RestController
public class HealthController {

	@Value("${gcul.runtime.mode:local}")
	private String runtimeMode;

	@Value("${gcul.cloud-sql.enabled:false}")
	private boolean cloudSqlEnabled;

	private final BlockchainOrchestratorService orchestrator;

	@Value("${gcul.services.target:local}")
	private String servicesTarget;

	public HealthController(BlockchainOrchestratorService orchestrator) {
		this.orchestrator = orchestrator;
	}

	@GetMapping("/health")
	public Map<String, Object> health() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("status", "ok");
		body.put("service", "blockchain-orchestrator-service");
		body.put("runtimeMode", runtimeMode);
		body.put("servicesTarget", servicesTarget);
		body.put("database", cloudSqlEnabled ? "cloud-sql-postgresql" : "h2");
		body.put("gcul_sidecar", orchestrator.sidecarHealth());
		return body;
	}
}
