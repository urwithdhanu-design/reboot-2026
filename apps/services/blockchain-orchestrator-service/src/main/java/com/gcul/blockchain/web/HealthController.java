package com.gcul.blockchain.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.blockchain.service.BlockchainOrchestratorService;

@RestController
public class HealthController {

	private final BlockchainOrchestratorService orchestrator;

	public HealthController(BlockchainOrchestratorService orchestrator) {
		this.orchestrator = orchestrator;
	}

	@GetMapping("/health")
	public Map<String, Object> health() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("status", "ok");
		body.put("service", "blockchain-orchestrator-service");
		body.put("gcul_sidecar", orchestrator.sidecarHealth());
		return body;
	}
}
