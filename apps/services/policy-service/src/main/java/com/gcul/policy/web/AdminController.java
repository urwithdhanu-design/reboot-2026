package com.gcul.policy.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.policy.admin.AdminPolicyService;
import com.gcul.policy.cache.AdminViewCache;
import com.gcul.policy.cache.FirestoreCacheProperties;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final AdminPolicyService admin;
	private final AdminViewCache adminCache;
	private final FirestoreCacheProperties firestoreProps;

	public AdminController(
			AdminPolicyService admin,
			AdminViewCache adminCache,
			FirestoreCacheProperties firestoreProps) {
		this.admin = admin;
		this.adminCache = adminCache;
		this.firestoreProps = firestoreProps;
	}

	@GetMapping("/policies")
	public Map<String, Object> policies() {
		return admin.listPolicies();
	}

	@GetMapping("/policy-stats")
	public Map<String, Object> stats() {
		return admin.stats();
	}

	@PostMapping("/policies/refresh-cache")
	public Map<String, Object> refreshPolicyCache() {
		admin.listPolicies();
		return Map.of(
				"ok", true,
				"firestore_active", adminCache.isActive(),
				"project_id", firestoreProps.getProjectId(),
				"collection", firestoreProps.getCollection(),
				"documents", List.of(AdminViewCache.DOC_POLICIES));
	}
}
