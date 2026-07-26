package com.gcul.policy.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.messaging.PolicyIssuanceService;

@RestController
@RequestMapping("/api/internal/policies")
public class InternalPolicyController {

	private final PolicyIssuanceService issuance;

	public InternalPolicyController(PolicyIssuanceService issuance) {
		this.issuance = issuance;
	}

	@GetMapping("/{policyId}")
	public Map<String, Object> getPolicy(@PathVariable String policyId) {
		Map<String, Object> policy = issuance.getPolicy(policyId);
		if (policy == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found: " + policyId);
		}
		return policy;
	}
}
