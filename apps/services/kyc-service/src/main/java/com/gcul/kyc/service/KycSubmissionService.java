package com.gcul.kyc.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

	public KycSubmissionService(
			UserStore store,
			KycAgentSettingsService agentSettings,
			CustomerEventPublisher customerEvents) {
		this.store = store;
		this.agentSettings = agentSettings;
		this.customerEvents = customerEvents;
	}

	@Transactional
	public Map<String, Object> submit(UserAccount user, KycSubmitRequest body) {
		Map<String, String> progress = new LinkedHashMap<>();
		progress.put("identity", "done");
		progress.put("verify", body.isDocumentUploaded() ? "done" : "pending");
		progress.put("liveness", body.isSelfieCaptured() ? "done" : "pending");
		boolean readyForReview = body.isDocumentUploaded() && body.isSelfieCaptured();

		boolean autoApprove = agentSettings.isAutoApproveEnabled() && readyForReview;
		String status = autoApprove ? "verified" : "in_progress";
		progress.put("complete", autoApprove ? "done" : (readyForReview ? "submitted" : "pending"));

		user.setKycStatus(status);
		user.setKycDocumentType(body.getDocumentType());
		user.setKycProgressJson(UserMapper.toJson(progress));
		user.setKycSubmittedAt(Instant.now().toString());
		user.setKycApprovalMode(autoApprove ? KycApprovalModes.AUTO_AGENT : null);
		store.save(user);

		if (autoApprove) {
			customerEvents.customerVerified(user);
		}

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("status", status);
		response.put("progress", progress);
		response.put("auto_approved", autoApprove);
		return response;
	}
}
