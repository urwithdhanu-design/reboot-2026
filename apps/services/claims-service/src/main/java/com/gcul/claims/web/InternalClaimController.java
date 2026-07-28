package com.gcul.claims.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.claims.service.ClaimLookupService;
import com.gcul.claims.service.ClaimWorkflowService;

@RestController
@RequestMapping("/api/internal/claims")
public class InternalClaimController {

	private final ClaimWorkflowService claims;
	private final ClaimLookupService claimLookup;

	public InternalClaimController(ClaimWorkflowService claims, ClaimLookupService claimLookup) {
		this.claims = claims;
		this.claimLookup = claimLookup;
	}

	@GetMapping("/by-policy/{policyRef}")
	public Map<String, Object> claimsByPolicy(
			@PathVariable String policyRef,
			@RequestParam(defaultValue = "false") boolean open) {
		return claimLookup.claimsForPolicy(policyRef, open);
	}

	@PostMapping("/parametric")
	public Map<String, Object> parametricAutoSettle(@RequestBody Map<String, Object> body) {
		return claims.createParametricAutoSettle(body);
	}
}
