package com.gcul.kyc.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.kyc.admin.AdminCustomerService;
import com.gcul.kyc.admin.KycAgentSettingsService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final AdminCustomerService admin;
	private final KycAgentSettingsService agentSettings;

	public AdminController(AdminCustomerService admin, KycAgentSettingsService agentSettings) {
		this.admin = admin;
		this.agentSettings = agentSettings;
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
}
