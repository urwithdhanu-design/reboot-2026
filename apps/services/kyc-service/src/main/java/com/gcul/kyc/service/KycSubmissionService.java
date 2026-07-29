package com.gcul.kyc.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.kyc.admin.AdminCustomerService;
import com.gcul.kyc.admin.KycAgentSettingsService;
import com.gcul.kyc.dto.KycSubmitRequest;
import com.gcul.kyc.dto.UserMapper;
import com.gcul.kyc.kyc.KycApprovalModes;
import com.gcul.kyc.messaging.CustomerEventPublisher;
import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.store.UserStore;

@Service
public class KycSubmissionService {

	private final UserStore store;
	private final KycAgentSettingsService agentSettings;
	private final CustomerEventPublisher customerEvents;
	private final AdminCustomerService adminCustomers;

	public KycSubmissionService(
			UserStore store,
			KycAgentSettingsService agentSettings,
			CustomerEventPublisher customerEvents,
			AdminCustomerService adminCustomers) {
		this.store = store;
		this.agentSettings = agentSettings;
		this.customerEvents = customerEvents;
		this.adminCustomers = adminCustomers;
	}

	@Transactional
	public Map<String, Object> submit(UserAccount user, KycSubmitRequest body) {
		Map<String, String> progress = new LinkedHashMap<>();
		progress.put("identity", "done");
		progress.put("verify", body.isDocumentUploaded() ? "done" : "pending");
		progress.put("liveness", body.isSelfieCaptured() ? "done" : "pending");
		boolean readyForReview = body.isDocumentUploaded() && body.isSelfieCaptured();

		boolean autoApprove = agentSettings.isAutoApproveEnabled() && readyForReview;
		String status = autoApprove ? "pending_consent" : "in_progress";
		progress.put("complete", autoApprove ? "submitted" : (readyForReview ? "submitted" : "pending"));

		user.setKycStatus(status);
		user.setKycDocumentType(body.getDocumentType());
		user.setKycProgressJson(UserMapper.toJson(progress));
		user.setKycSubmittedAt(Instant.now().toString());
		user.setKycApprovalMode(autoApprove ? KycApprovalModes.AUTO_AGENT : null);
		user.setKycConsentAt(null);
		store.save(user);

		adminCustomers.refreshAdminViewCaches();

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("status", status);
		response.put("progress", progress);
		response.put("auto_approved", autoApprove);
		response.put("requires_consent", autoApprove);
		return response;
	}

	@Transactional
	public Map<String, Object> acceptConsent(UserAccount user) {
		if (!"pending_consent".equals(user.getKycStatus())) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Digitisation consent is not required for your current verification status");
		}

		Map<String, String> progress = UserMapper.fromJsonMap(user.getKycProgressJson());
		progress.put("complete", "done");
		user.setKycProgressJson(UserMapper.toJson(progress));
		user.setKycStatus("verified");
		user.setKycConsentAt(Instant.now().toString());
		store.save(user);
		customerEvents.customerVerified(user);
		adminCustomers.refreshAdminViewCaches();

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("status", "verified");
		response.put("consent_accepted", true);
		response.put("consent_accepted_at", user.getKycConsentAt());
		return response;
	}
}
