package com.gcul.kyc.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.kyc.admin.AdminCustomerService;
import com.gcul.kyc.admin.KycAgentSettingsService;
import com.gcul.kyc.cache.AdminViewCache;
import com.gcul.kyc.cache.FirestoreCacheProperties;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final AdminCustomerService admin;
	private final KycAgentSettingsService agentSettings;
	private final AdminViewCache adminCache;
	private final FirestoreCacheProperties firestoreProps;

	public AdminController(
			AdminCustomerService admin,
			KycAgentSettingsService agentSettings,
			AdminViewCache adminCache,
			FirestoreCacheProperties firestoreProps) {
		this.admin = admin;
		this.agentSettings = agentSettings;
		this.adminCache = adminCache;
		this.firestoreProps = firestoreProps;
	}

	@GetMapping("/customers")
	public Map<String, Object> customers(
			@RequestParam(required = false) String q,
			@RequestParam(required = false, name = "kyc_status") String kycStatus) {
		return admin.listCustomers(q, kycStatus);
	}

	@GetMapping("/kyc-queue")
	public Map<String, Object> kycQueue() {
		return admin.kycQueue();
	}

	@GetMapping("/customer-stats")
	public Map<String, Object> stats() {
		return admin.stats();
	}

	@PatchMapping("/customers/{userId}/kyc")
	public Map<String, Object> patchKyc(
			@PathVariable String userId,
			@RequestBody Map<String, String> body) {
		String status = body == null ? null : body.get("status");
		return admin.updateKycStatus(userId, status);
	}

	@GetMapping("/kyc-settings")
	public Map<String, Object> kycSettings() {
		return agentSettings.getSettings();
	}

	@PatchMapping("/kyc-settings")
	public Map<String, Object> patchKycSettings(@RequestBody Map<String, Object> body) {
		boolean enabled = Boolean.TRUE.equals(body.get("auto_approve_agent"));
		return agentSettings.setAutoApproveAgent(enabled);
	}

	@PostMapping("/refresh-cache")
	public Map<String, Object> refreshCache() {
		admin.refreshAdminViewCaches();
		return Map.of(
				"ok", true,
				"firestore_active", adminCache.isActive(),
				"project_id", firestoreProps.getProjectId(),
				"collection", firestoreProps.getCollection(),
				"documents", List.of(AdminViewCache.DOC_CUSTOMERS, AdminViewCache.DOC_KYC_QUEUE));
	}
}
