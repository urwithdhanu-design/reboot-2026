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
		String userId = attribute(request, "userId");
		String email = attribute(request, "userEmail");
		List<Map<String, Object>> policies = issuance.listCustomerPolicies(userId, email);
		return Map.of("policies", policies, "count", policies.size());
	}

	private static String attribute(HttpServletRequest request, String name) {
		Object value = request.getAttribute(name);
		if (value instanceof String text && !text.isBlank() && !"null".equalsIgnoreCase(text)) {
			return text.trim();
		}
		return "";
	}
}
