package com.gcul.blockchain.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.blockchain.service.ChainObservabilityService;

@RestController
@RequestMapping("/api/blockchain")
public class ChainObservabilityController {

	private final ChainObservabilityService observability;

	public ChainObservabilityController(ChainObservabilityService observability) {
		this.observability = observability;
	}

	/** Real-time dashboard, tracing, contract stats, performance, and security alerts. */
	@GetMapping("/observability")
	public Map<String, Object> observability() {
		return observability.snapshot();
	}
}
