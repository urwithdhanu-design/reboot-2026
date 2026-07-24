package com.gcul.kyc.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.gcul.kyc.model.KycAgentSettings;
import com.gcul.kyc.repository.KycAgentSettingsRepository;

/** Ensures auto-approve agent defaults to ON for new environments. */
@Component
@Order(2)
public class KycAgentSettingsBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(KycAgentSettingsBootstrap.class);

	private final KycAgentSettingsRepository settingsRepo;

	public KycAgentSettingsBootstrap(KycAgentSettingsRepository settingsRepo) {
		this.settingsRepo = settingsRepo;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (settingsRepo.existsById(KycAgentSettings.DEFAULT_ID)) {
			return;
		}
		KycAgentSettings settings = new KycAgentSettings();
		settings.setId(KycAgentSettings.DEFAULT_ID);
		settings.setAutoApprove(true);
		settingsRepo.save(settings);
		log.info("Seeded kyc_agent_settings with auto_approve=true");
	}
}
