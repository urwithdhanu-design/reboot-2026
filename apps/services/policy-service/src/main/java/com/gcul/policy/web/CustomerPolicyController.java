package com.gcul.policy.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.policy.dto.PolicyCancelRequest;
import com.gcul.policy.messaging.PolicyIssuanceService;
import com.gcul.policy.policy.PolicyCancellationService;
import com.gcul.policy.policy.PolicyRenewalService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/policies")
public class CustomerPolicyController {

	private final PolicyIssuanceService issuance;
	private final PolicyCancellationService cancellation;
	private final PolicyRenewalService renewal;

	public CustomerPolicyController(
			PolicyIssuanceService issuance,
			PolicyCancellationService cancellation,
			PolicyRenewalService renewal) {
		this.issuance = issuance;
		this.cancellation = cancellation;
		this.renewal = renewal;
	}

	@GetMapping("/me")
	public Map<String, Object> myPolicies(HttpServletRequest request) {
		String userId = attribute(request, "userId");
		String email = attribute(request, "userEmail");
		List<Map<String, Object>> policies = issuance.listCustomerPolicies(userId, email);
		return Map.of("policies", policies, "count", policies.size());
	}

	@PostMapping("/{policyId}/cancel/preview")
	public Map<String, Object> previewCancel(
			@PathVariable String policyId,
			HttpServletRequest request) {
		return cancellation.previewCancel(
				policyId,
				attribute(request, "userId"),
				attribute(request, "userEmail"));
	}

	@PostMapping("/{policyId}/cancel")
	public Map<String, Object> cancelPolicy(
			@PathVariable String policyId,
			@RequestBody PolicyCancelRequest body,
			HttpServletRequest request) {
		return cancellation.executeCancel(
				policyId,
				attribute(request, "userId"),
				attribute(request, "userEmail"),
				body.getReason(),
				body.getCustomerNote(),
				body.getConfirmRefundAmountGbp());
	}

	@PostMapping("/{policyId}/renew")
	public Map<String, Object> renewHomePolicy(
			@PathVariable String policyId,
			HttpServletRequest request) {
		return renewal.renewHomePolicy(policyId, attribute(request, "userId"), attribute(request, "userEmail"));
	}

	private static String attribute(HttpServletRequest request, String name) {
		Object value = request.getAttribute(name);
		if (value instanceof String text && !text.isBlank() && !"null".equalsIgnoreCase(text)) {
			return text.trim();
		}
		return "";
	}
}
