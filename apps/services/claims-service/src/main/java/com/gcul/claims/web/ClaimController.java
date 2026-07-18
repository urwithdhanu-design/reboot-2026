package com.gcul.claims.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.claims.service.ClaimWorkflowService;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

	private final ClaimWorkflowService claims;

	public ClaimController(ClaimWorkflowService claims) {
		this.claims = claims;
	}

	@GetMapping
	public Map<String, Object> list(@RequestParam(required = false) String status) {
		List<Map<String, Object>> items = claims.list(status);
		return Map.of("claims", items, "count", items.size());
	}

	@PostMapping
	public Map<String, Object> create(@RequestBody Map<String, Object> body) {
		return claims.create(body);
	}

	@GetMapping("/{id}")
	public Map<String, Object> get(@PathVariable String id) {
		return claims.get(id);
	}

	@PatchMapping("/{id}/status")
	public Map<String, Object> status(@PathVariable String id, @RequestBody Map<String, Object> body) {
		return claims.updateStatus(id, body);
	}
}
