package com.gcul.blockchain.web;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.blockchain.canton.CantonCapitalMarketService;
import com.gcul.blockchain.canton.CantonHealthProbe;
import com.gcul.blockchain.canton.CantonPolicyMintService;
import com.gcul.blockchain.canton.LedgerReconciliationService;
import com.gcul.blockchain.ledger.PolicyNftMintService;
import com.gcul.blockchain.model.PolicyNftRecord;

@RestController
@RequestMapping("/api/blockchain/canton")
public class CantonController {

	private final CantonPolicyMintService cantonPolicyMintService;
	private final PolicyNftMintService policyNftMintService;
	private final CantonHealthProbe cantonHealthProbe;
	private final LedgerReconciliationService reconciliationService;
	private final CantonCapitalMarketService capitalMarketService;

	public CantonController(
			CantonPolicyMintService cantonPolicyMintService,
			PolicyNftMintService policyNftMintService,
			CantonHealthProbe cantonHealthProbe,
			LedgerReconciliationService reconciliationService,
			CantonCapitalMarketService capitalMarketService) {
		this.cantonPolicyMintService = cantonPolicyMintService;
		this.policyNftMintService = policyNftMintService;
		this.cantonHealthProbe = cantonHealthProbe;
		this.reconciliationService = reconciliationService;
		this.capitalMarketService = capitalMarketService;
	}

	@GetMapping("/health")
	public Map<String, Object> health() {
		return cantonHealthProbe.probe();
	}

	@GetMapping("/reconciliation")
	public Map<String, Object> reconciliation() {
		return reconciliationService.runReport();
	}

	@GetMapping("/capital-market")
	public Map<String, Object> capitalMarket() {
		return capitalMarketService.status();
	}

	@GetMapping("/status")
	public Map<String, Object> status() {
		Map<String, Object> body = new LinkedHashMap<>(cantonPolicyMintService.status());
		body.put("ledgerBackend", "canton");
		body.put("probe", cantonHealthProbe.probe());
		return body;
	}

	@GetMapping("/policies")
	public Map<String, Object> policies() {
		List<Map<String, Object>> items = policyNftMintService.recentMints().stream()
				.filter(record -> "canton".equalsIgnoreCase(record.getMintMode()))
				.map(this::toResponse)
				.toList();
		return Map.of(
				"records", items,
				"count", items.size(),
				"live", cantonPolicyMintService.isActive());
	}

	private Map<String, Object> toResponse(PolicyNftRecord record) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("policyId", record.getPolicyId());
		map.put("policyNumber", record.getPolicyNumber());
		map.put("customerId", record.getCustomerId());
		map.put("walletAddress", record.getWalletAddress());
		map.put("tokenId", record.getTokenId());
		map.put("contractId", record.getTokenId());
		map.put("updateId", record.getTransactionHash());
		map.put("templateId", record.getContractAddress());
		map.put("network", record.getNetwork());
		map.put("mintStatus", record.getMintStatus());
		map.put("mintedAt", record.getMintedAt().toString());
		return map;
	}
}
