package com.gcul.kyc.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.kyc.kyc.KycApprovalModes;
import com.gcul.kyc.messaging.CustomerEventPublisher;
import com.gcul.kyc.model.KycAgentSettings;
import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.repository.KycAgentSettingsRepository;
import com.gcul.kyc.repository.UserAccountRepository;

@Service
public class KycAgentSettingsService {

	private final KycAgentSettingsRepository settingsRepo;
	private final UserAccountRepository users;
	private final CustomerEventPublisher customerEvents;
	private final AdminCustomerService adminCustomers;

	public KycAgentSettingsService(
			KycAgentSettingsRepository settingsRepo,
			UserAccountRepository users,
			CustomerEventPublisher customerEvents,
			AdminCustomerService adminCustomers) {
		this.settingsRepo = settingsRepo;
		this.users = users;
		this.customerEvents = customerEvents;
		this.adminCustomers = adminCustomers;
	}

	@Transactional(readOnly = true)
	public boolean isAutoApproveEnabled() {
		return settingsRepo.findById(KycAgentSettings.DEFAULT_ID)
				.map(KycAgentSettings::isAutoApprove)
				.orElse(true);
	}

	@Transactional(readOnly = true)
	public Map<String, Object> getSettings() {
		return Map.of("auto_approve_agent", isAutoApproveEnabled());
	}

	@Transactional
	public Map<String, Object> setAutoApproveAgent(boolean enabled) {
		KycAgentSettings settings = settingsRepo.findById(KycAgentSettings.DEFAULT_ID)
				.orElseGet(this::newDefaultSettings);
		settings.setAutoApprove(enabled);
		settingsRepo.save(settings);

		int queueApproved = 0;
		if (enabled) {
			queueApproved = approveAllInProgress();
		}

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("auto_approve_agent", enabled);
		response.put("queue_auto_approved", queueApproved);
		adminCustomers.refreshAdminViewCaches();
		return response;
	}

	@Transactional
	public int approveAllInProgress() {
		List<UserAccount> pending = users.findByKycStatusOrderByKycSubmittedAtDesc("in_progress");
		for (UserAccount user : pending) {
			user.setKycStatus("verified");
			user.setKycApprovalMode(KycApprovalModes.AUTO_AGENT);
			users.save(user);
			customerEvents.customerVerified(user);
		}
		return pending.size();
	}

	private KycAgentSettings newDefaultSettings() {
		KycAgentSettings settings = new KycAgentSettings();
		settings.setId(KycAgentSettings.DEFAULT_ID);
		settings.setAutoApprove(true);
		return settings;
	}
}
