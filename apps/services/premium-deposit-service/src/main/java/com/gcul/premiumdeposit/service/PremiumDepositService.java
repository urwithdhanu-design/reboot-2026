package com.gcul.premiumdeposit.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.premiumdeposit.model.PremiumDeposit;
import com.gcul.premiumdeposit.repository.PremiumDepositRepository;

@Service
public class PremiumDepositService {

	private final PremiumDepositRepository repo;

	public PremiumDepositService(PremiumDepositRepository repo) {
		this.repo = repo;
	}

	public Map<String, Object> create(Map<String, Object> body) {
		String policyRef = str(body.get("policy_ref"));
		if (policyRef.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policy_ref is required");
		}
		PremiumDeposit deposit = new PremiumDeposit();
		deposit.setId("DEP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		deposit.setPolicyRef(policyRef);
		deposit.setCustomerId(firstNonBlank(str(body.get("customer_id")), "customer"));
		deposit.setAmount(num(body.get("amount"), 0));
		deposit.setCurrency(firstNonBlank(str(body.get("currency")), "GBP"));
		deposit.setStatus("held");
		deposit.setCreatedAt(Instant.now());
		return toMap(repo.save(deposit));
	}

	public List<Map<String, Object>> list() {
		return repo.findAllByOrderByCreatedAtDesc().stream().map(this::toMap).toList();
	}

	public Map<String, Object> get(String id) {
		return toMap(repo.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deposit not found")));
	}

	public Map<String, Object> release(String id) {
		PremiumDeposit deposit = repo.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deposit not found"));
		deposit.setStatus("released");
		deposit.setReleasedAt(Instant.now());
		return toMap(repo.save(deposit));
	}

	private Map<String, Object> toMap(PremiumDeposit d) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", d.getId());
		map.put("policy_ref", d.getPolicyRef());
		map.put("customer_id", d.getCustomerId());
		map.put("amount", d.getAmount());
		map.put("currency", d.getCurrency());
		map.put("status", d.getStatus());
		map.put("created_at", d.getCreatedAt().toString());
		map.put("released_at", d.getReleasedAt() == null ? null : d.getReleasedAt().toString());
		return map;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static double num(Object value, double fallback) {
		try {
			return Double.parseDouble(String.valueOf(value));
		} catch (Exception ex) {
			return fallback;
		}
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) return value;
		}
		return "";
	}
}
