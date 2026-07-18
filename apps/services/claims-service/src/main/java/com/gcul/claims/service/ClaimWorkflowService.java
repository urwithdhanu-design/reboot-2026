package com.gcul.claims.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.claims.model.InsuranceClaim;
import com.gcul.claims.repository.ClaimRepository;

@Service
public class ClaimWorkflowService {

	private static final Set<String> STATUSES = Set.of(
			"submitted", "in_review", "approved", "rejected", "paid");

	private final ClaimRepository repo;

	public ClaimWorkflowService(ClaimRepository repo) {
		this.repo = repo;
	}

	public Map<String, Object> create(Map<String, Object> body) {
		String policyRef = str(body.get("policy_ref"));
		if (policyRef.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policy_ref is required");
		}
		InsuranceClaim claim = new InsuranceClaim();
		claim.setId("CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		claim.setPolicyRef(policyRef);
		claim.setCustomerName(firstNonBlank(str(body.get("customer_name")), "Customer"));
		claim.setCategory(firstNonBlank(str(body.get("category")), "General"));
		claim.setAmountClaimed(num(body.get("amount_claimed"), 0));
		claim.setDescription(str(body.get("description")));
		claim.setSource(firstNonBlank(str(body.get("source")), "manual"));
		claim.setStatus("submitted");
		claim.setCreatedAt(Instant.now());
		claim.setUpdatedAt(Instant.now());
		return toMap(repo.save(claim));
	}

	public List<Map<String, Object>> list(String status) {
		List<InsuranceClaim> rows = status == null || status.isBlank()
				? repo.findAllByOrderByCreatedAtDesc()
				: repo.findByStatusOrderByCreatedAtDesc(status);
		return rows.stream().map(this::toMap).toList();
	}

	public Map<String, Object> get(String id) {
		return toMap(find(id));
	}

	public Map<String, Object> updateStatus(String id, Map<String, Object> body) {
		String status = str(body.get("status")).toLowerCase(Locale.ROOT);
		if (!STATUSES.contains(status)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
		}
		InsuranceClaim claim = find(id);
		claim.setStatus(status);
		claim.setUpdatedAt(Instant.now());
		return toMap(repo.save(claim));
	}

	private InsuranceClaim find(String id) {
		return repo.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
	}

	private Map<String, Object> toMap(InsuranceClaim c) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", c.getId());
		map.put("policy_ref", c.getPolicyRef());
		map.put("customer_name", c.getCustomerName());
		map.put("category", c.getCategory());
		map.put("status", c.getStatus());
		map.put("amount_claimed", c.getAmountClaimed());
		map.put("description", c.getDescription());
		map.put("source", c.getSource());
		map.put("created_at", c.getCreatedAt().toString());
		map.put("updated_at", c.getUpdatedAt() == null ? null : c.getUpdatedAt().toString());
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
