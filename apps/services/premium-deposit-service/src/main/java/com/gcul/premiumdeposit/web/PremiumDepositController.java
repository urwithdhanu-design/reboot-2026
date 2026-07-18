package com.gcul.premiumdeposit.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.premiumdeposit.service.PremiumDepositService;

@RestController
@RequestMapping("/api/premium-deposits")
public class PremiumDepositController {

	private final PremiumDepositService deposits;

	public PremiumDepositController(PremiumDepositService deposits) {
		this.deposits = deposits;
	}

	@GetMapping
	public Map<String, Object> list() {
		List<Map<String, Object>> items = deposits.list();
		return Map.of("deposits", items, "count", items.size());
	}

	@PostMapping
	public Map<String, Object> create(@RequestBody Map<String, Object> body) {
		return deposits.create(body);
	}

	@GetMapping("/{id}")
	public Map<String, Object> get(@PathVariable String id) {
		return deposits.get(id);
	}

	@PostMapping("/{id}/release")
	public Map<String, Object> release(@PathVariable String id) {
		return deposits.release(id);
	}
}
