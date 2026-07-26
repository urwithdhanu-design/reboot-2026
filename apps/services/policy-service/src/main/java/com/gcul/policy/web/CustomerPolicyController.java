package com.gcul.policy.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.policy.messaging.PolicyIssuanceService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/policies")
public class CustomerPolicyController {

	private final PolicyIssuanceService issuance;

	public CustomerPolicyController(PolicyIssuanceService issuance) {
		this.issuance = issuance;
	}

	@GetMapping("/me")
	public Map<String, Object> myPolicies(HttpServletRequest request) {
		String userId = String.valueOf(request.getAttribute("userId"));
		String email = String.valueOf(request.getAttribute("userEmail"));
		List<Map<String, Object>> policies = issuance.listCustomerPolicies(userId, email);
		return Map.of("policies", policies, "count", policies.size());
	}
}
