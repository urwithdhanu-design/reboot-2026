package com.gcul.blockchain.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.blockchain.canton.CantonKitTestService;

@RestController
@RequestMapping("/api/blockchain/canton/kit-tests")
public class CantonKitTestController {

	private final CantonKitTestService kitTestService;

	public CantonKitTestController(CantonKitTestService kitTestService) {
		this.kitTestService = kitTestService;
	}

	@GetMapping("/run")
	public Map<String, Object> runGet() {
		return run();
	}

	@PostMapping("/run")
	public Map<String, Object> run() {
		if (!kitTestService.isEnabled()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Canton kit tests disabled");
		}
		return kitTestService.runAll();
	}
}
