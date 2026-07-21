package com.gcul.policy.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.policy.admin.AdminPolicyService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final AdminPolicyService admin;

	public AdminController(AdminPolicyService admin) {
		this.admin = admin;
	}

	@GetMapping("/policies")
	public Map<String, Object> policies() {
		return admin.listPolicies();
	}

	@GetMapping("/policy-stats")
	public Map<String, Object> stats() {
		return admin.stats();
	}
}
