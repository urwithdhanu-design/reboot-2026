package com.gcul.blockchain.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.blockchain.service.BlockchainOrchestratorService;

@RestController
@RequestMapping("/api/blockchain")
public class BlockchainController {

	private final BlockchainOrchestratorService orchestrator;

	public BlockchainController(BlockchainOrchestratorService orchestrator) {
		this.orchestrator = orchestrator;
	}

	@GetMapping("/transactions")
	public Map<String, Object> list() {
		List<Map<String, Object>> items = orchestrator.list();
		return Map.of("transactions", items, "count", items.size());
	}

	@PostMapping("/transactions")
	public Map<String, Object> submit(@RequestBody Map<String, Object> body) {
		return orchestrator.submit(body);
	}

	@GetMapping("/transactions/{id}")
	public Map<String, Object> get(@PathVariable String id) {
		return orchestrator.get(id);
	}

	@PostMapping("/settle-claim")
	public Map<String, Object> settle(@RequestBody Map<String, Object> body) {
		return orchestrator.settleClaim(body);
	}

	@GetMapping("/gcul/health")
	public Map<String, Object> gculHealth() {
		return orchestrator.sidecarHealth();
	}
}
