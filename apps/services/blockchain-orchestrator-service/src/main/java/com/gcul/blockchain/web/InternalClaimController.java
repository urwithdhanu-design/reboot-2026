package com.gcul.blockchain.web;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.blockchain.service.BlockchainOrchestratorService;

@RestController
@RequestMapping("/api/blockchain/internal/claims")
public class InternalClaimController {

	private final BlockchainOrchestratorService orchestrator;

	public InternalClaimController(BlockchainOrchestratorService orchestrator) {
		this.orchestrator = orchestrator;
	}

	@PostMapping("/settle")
	public Map<String, Object> settle(@RequestBody Map<String, Object> body) {
		return orchestrator.settleClaim(body);
	}

	@PostMapping("/parametric-initiated")
	public Map<String, Object> parametricInitiated(@RequestBody Map<String, Object> body) {
		return orchestrator.recordParametricClaimInitiated(body);
	}
}
