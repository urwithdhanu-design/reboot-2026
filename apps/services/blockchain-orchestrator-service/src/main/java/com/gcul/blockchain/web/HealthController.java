package com.gcul.blockchain.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.blockchain.config.LedgerProperties;
import com.gcul.blockchain.ethereum.PolicyNftMintService;
import com.gcul.blockchain.service.BlockchainOrchestratorService;

@RestController
public class HealthController {

	@Value("${gcul.runtime.mode:local}")
	private String runtimeMode;

	@Value("${gcul.cloud-sql.enabled:false}")
	private boolean cloudSqlEnabled;

	private final BlockchainOrchestratorService orchestrator;
	private final PolicyNftMintService policyNftMintService;
	private final LedgerProperties ledgerProperties;

	@Value("${gcul.services.target:local}")
	private String servicesTarget;

	public HealthController(
			BlockchainOrchestratorService orchestrator,
			PolicyNftMintService policyNftMintService,
			LedgerProperties ledgerProperties) {
		this.orchestrator = orchestrator;
		this.policyNftMintService = policyNftMintService;
		this.ledgerProperties = ledgerProperties;
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
		body.put("ledger_backend", ledgerProperties.getBackend());
		body.put("primary_ledger", ledgerProperties.resolvedPrimary());
		body.put("secondary_ledgers", ledgerProperties.secondaryLedgers());
		body.put("ledger", policyNftMintService.status());
		return body;
	}
}
