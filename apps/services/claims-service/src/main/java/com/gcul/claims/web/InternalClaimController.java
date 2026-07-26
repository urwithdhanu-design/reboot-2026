package com.gcul.claims.web;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.claims.service.ClaimWorkflowService;

@RestController
@RequestMapping("/api/internal/claims")
public class InternalClaimController {

	private final ClaimWorkflowService claims;

	public InternalClaimController(ClaimWorkflowService claims) {
		this.claims = claims;
	}

	@PostMapping("/parametric")
	public Map<String, Object> parametricAutoSettle(@RequestBody Map<String, Object> body) {
		return claims.createParametricAutoSettle(body);
	}
}
