package com.gcul.parametric.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.parametric.model.ParametricRule;
import com.gcul.parametric.repository.ParametricRuleRepository;

@Service
public class ParametricTriggerService {

	private final ParametricRuleRepository repo;
	private final RestClient http;
	private final String claimsBaseUrl;

	public ParametricTriggerService(
			ParametricRuleRepository repo,
			@Value("${gcul.claims-service.url:http://127.0.0.1:8085}") String claimsBaseUrl) {
		this.repo = repo;
		this.claimsBaseUrl = claimsBaseUrl;
		this.http = RestClient.create();
	}

	public Map<String, Object> createRule(Map<String, Object> body) {
		ParametricRule rule = new ParametricRule();
		rule.setId("PR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		rule.setName(firstNonBlank(str(body.get("name")), "Parametric rule"));
		rule.setMetric(firstNonBlank(str(body.get("metric")), "rainfall_mm"));
		rule.setThreshold(num(body.get("threshold"), 50));
		rule.setComparison(firstNonBlank(str(body.get("comparison")), "gte"));
		rule.setPayoutAmount(num(body.get("payout_amount"), 500));
		rule.setPolicyRef(firstNonBlank(str(body.get("policy_ref")), "POL-DEMO"));
		rule.setActive(true);
		rule.setCreatedAt(Instant.now());
		return toMap(repo.save(rule));
	}

	public List<Map<String, Object>> listRules() {
		return repo.findAllByOrderByCreatedAtDesc().stream().map(this::toMap).toList();
	}

	public Map<String, Object> trigger(Map<String, Object> body) {
		String ruleId = str(body.get("rule_id"));
		double observed = num(body.get("observed_value"), 0);
		ParametricRule rule = repo.findById(ruleId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found"));
		if (!rule.isActive()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rule is inactive");
		}
		boolean matched = matches(rule, observed);
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("rule_id", rule.getId());
		result.put("matched", matched);
		result.put("observed_value", observed);
		result.put("threshold", rule.getThreshold());
		if (!matched) {
			result.put("claim", null);
			result.put("message", "Threshold not met");
			return result;
		}

		Map<String, Object> claimBody = new LinkedHashMap<>();
		claimBody.put("policy_ref", rule.getPolicyRef());
		claimBody.put("customer_name", firstNonBlank(str(body.get("customer_name")), "Parametric insured"));
		claimBody.put("category", "Parametric");
		claimBody.put("amount_claimed", rule.getPayoutAmount());
		claimBody.put("description", "Auto-triggered by " + rule.getName()
				+ " (" + rule.getMetric() + "=" + observed + ")");
		claimBody.put("source", "parametric");

		try {
			@SuppressWarnings("unchecked")
			Map<String, Object> claim = http.post()
					.uri(claimsBaseUrl + "/api/claims")
					.body(claimBody)
					.retrieve()
					.body(Map.class);
			result.put("claim", claim);
			result.put("message", "Parametric claim created");
		} catch (Exception ex) {
			result.put("claim", null);
			result.put("message", "Matched but claims-service unavailable: " + ex.getMessage());
		}
		return result;
	}

	private static boolean matches(ParametricRule rule, double observed) {
		return switch (rule.getComparison().toLowerCase(Locale.ROOT)) {
			case "gt" -> observed > rule.getThreshold();
			case "lte" -> observed <= rule.getThreshold();
			case "lt" -> observed < rule.getThreshold();
			default -> observed >= rule.getThreshold();
		};
	}

	private Map<String, Object> toMap(ParametricRule r) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", r.getId());
		map.put("name", r.getName());
		map.put("metric", r.getMetric());
		map.put("threshold", r.getThreshold());
		map.put("comparison", r.getComparison());
		map.put("payout_amount", r.getPayoutAmount());
		map.put("policy_ref", r.getPolicyRef());
		map.put("active", r.isActive());
		map.put("created_at", r.getCreatedAt().toString());
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
