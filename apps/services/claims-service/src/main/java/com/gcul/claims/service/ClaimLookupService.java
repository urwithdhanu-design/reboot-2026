package com.gcul.claims.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.gcul.claims.model.ClaimStatus;
import com.gcul.claims.model.InsuranceClaim;
import com.gcul.claims.repository.ClaimRepository;

@Service
public class ClaimLookupService {

	private static final List<String> OPEN_STATUSES = List.of(
			ClaimStatus.SUBMITTED,
			ClaimStatus.IN_REVIEW,
			ClaimStatus.PENDING_APPROVAL,
			ClaimStatus.APPROVED,
			ClaimStatus.PAYMENT_PENDING,
			ClaimStatus.AWAITING_CUSTOMER);

	private final ClaimRepository claims;

	public ClaimLookupService(ClaimRepository claims) {
		this.claims = claims;
	}

	public Map<String, Object> claimsForPolicy(String policyRef, boolean openOnly) {
		List<InsuranceClaim> rows = openOnly
				? claims.findByPolicyRefAndStatusInOrderByCreatedAtDesc(policyRef, OPEN_STATUSES)
				: claims.findByPolicyRefAndStatusInOrderByCreatedAtDesc(policyRef, allStatuses());
		List<Map<String, Object>> items = rows.stream().map(this::toSummary).toList();
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("policy_ref", policyRef);
		response.put("claims", items);
		response.put("count", items.size());
		response.put("open_count", openOnly ? items.size() : countOpen(policyRef));
		return response;
	}

	public long countOpenClaims(String policyRef) {
		return countOpen(policyRef);
	}

	private long countOpen(String policyRef) {
		return claims.countByPolicyRefAndStatusIn(policyRef, OPEN_STATUSES);
	}

	private static List<String> allStatuses() {
		return List.of(
				ClaimStatus.SUBMITTED,
				ClaimStatus.IN_REVIEW,
				ClaimStatus.PENDING_APPROVAL,
				ClaimStatus.APPROVED,
				ClaimStatus.PAYMENT_PENDING,
				ClaimStatus.PAID_OUT,
				ClaimStatus.SETTLED,
				ClaimStatus.REJECTED,
				ClaimStatus.AWAITING_CUSTOMER,
				ClaimStatus.PAID);
	}

	private Map<String, Object> toSummary(InsuranceClaim claim) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", claim.getId());
		map.put("policy_ref", claim.getPolicyRef());
		map.put("status", claim.getStatus());
		map.put("amount_claimed", claim.getAmountClaimed());
		map.put("created_at", claim.getCreatedAt() == null ? null : claim.getCreatedAt().toString());
		return map;
	}
}
