package com.gcul.kyc.config;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.security.PasswordService;
import com.gcul.kyc.security.PlatformRoles;
import com.gcul.kyc.store.UserStore;

@Component
@Order(1)
public class PlatformAdminSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(PlatformAdminSeeder.class);

	private final UserStore store;
	private final PasswordService passwords;
	private final boolean seedEnabled;
	private final String adminEmail;
	private final String adminPassword;
	private final String adminName;

	public PlatformAdminSeeder(
			UserStore store,
			PasswordService passwords,
			@Value("${gcul.admin.seed-enabled:true}") boolean seedEnabled,
			@Value("${gcul.admin.email:admin@reboot2026.local}") String adminEmail,
			@Value("${gcul.admin.password:Reboot2026!Admin}") String adminPassword,
			@Value("${gcul.admin.full-name:Platform Admin}") String adminName) {
		this.store = store;
		this.passwords = passwords;
		this.seedEnabled = seedEnabled;
		this.adminEmail = adminEmail.trim().toLowerCase();
		this.adminPassword = adminPassword;
		this.adminName = adminName;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!seedEnabled || adminPassword == null || adminPassword.isBlank()) {
			return;
		}
		var existing = store.findByEmail(adminEmail);
		if (existing.isPresent()) {
			UserAccount user = existing.get();
			if (!user.isPlatformAdmin()) {
				user.setRole(PlatformRoles.PLATFORM_ADMIN);
				store.save(user);
				log.info("Promoted existing user {} to platform admin", adminEmail);
			}
			return;
		}

		UserAccount admin = new UserAccount();
		admin.setId(UUID.randomUUID().toString());
		admin.setFullName(adminName);
		admin.setEmail(adminEmail);
		admin.setMobileNumber("+440000000001");
		admin.setPasswordHash(passwords.hash(adminPassword));
		admin.setTermsAccepted(true);
		admin.setCreatedAt(Instant.now().toString());
		admin.setRole(PlatformRoles.PLATFORM_ADMIN);
		admin.setKycStatus("verified");
		store.save(admin);
		log.info("Seeded platform admin account {}", adminEmail);
	}
}
