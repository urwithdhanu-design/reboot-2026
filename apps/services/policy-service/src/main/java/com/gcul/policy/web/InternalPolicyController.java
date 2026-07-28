package com.gcul.policy.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.messaging.PolicyIssuanceService;
import com.gcul.policy.policy.PolicyRecordService;

@RestController
@RequestMapping("/api/internal/policies")
public class InternalPolicyController {

	private final PolicyIssuanceService issuance;
	private final PolicyRecordService policyRecords;

	public InternalPolicyController(PolicyIssuanceService issuance, PolicyRecordService policyRecords) {
		this.issuance = issuance;
		this.policyRecords = policyRecords;
	}

	@GetMapping("/{policyId}")
	public Map<String, Object> getPolicy(@PathVariable String policyId) {
		Map<String, Object> policy = issuance.getPolicy(policyId);
		if (policy == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found: " + policyId);
		}
		return policy;
	}

	@PostMapping("/{policyId}/coverage/consume")
	public Map<String, Object> consumeCoverage(
			@PathVariable String policyId,
			@RequestBody Map<String, Object> body) {
		Object rawAmount = body.get("amount");
		double amount;
		try {
			amount = Double.parseDouble(String.valueOf(rawAmount));
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount is required");
		}
		return policyRecords.toResponse(policyRecords.consumeCoverage(policyId, amount));
	}
}
