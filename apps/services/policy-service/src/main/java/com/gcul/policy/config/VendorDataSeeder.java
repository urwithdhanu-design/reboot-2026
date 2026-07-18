package com.gcul.policy.config;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.policy.vendor.InsuranceVendor;
import com.gcul.policy.vendor.InsuranceVendorRepository;
import com.gcul.policy.vendor.VendorAccount;
import com.gcul.policy.vendor.VendorAccountRepository;

@Component
public class VendorDataSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(VendorDataSeeder.class);

	private final InsuranceVendorRepository vendors;
	private final VendorAccountRepository accounts;
	private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder();

	public VendorDataSeeder(InsuranceVendorRepository vendors, VendorAccountRepository accounts) {
		this.vendors = vendors;
		this.accounts = accounts;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (vendors.findByCodeIgnoreCase("vitality").isPresent()) {
			return;
		}

		InsuranceVendor vitality = new InsuranceVendor();
		vitality.setId("vnd-vitality");
		vitality.setName("Vitality");
		vitality.setCode("vitality");
		vitality.setCategories("Health");
		vitality.setContactEmail("vendor.vitality@example.com");
		vitality.setContactName("Vitality Partnerships");
		vitality.setDescription("Health Plan partner — Vitality.");
		vitality.setWebsiteUrl("https://www.vitality.co.uk");
		vitality.setStatus("active");
		vitality.setUiDeployUrl("https://vendors.reboot2026.local/vitality");
		vitality.setUiVersion("1.0.0");
		vitality.setServicesConfigJson(
				"{\"vendor_code\":\"vitality\",\"apis\":[\"/api/quotes\",\"/api/products\"],\"categories\":\"Health\"}");
		vitality.setPublishedAt(Instant.now().toString());
		vitality.setCreatedAt(Instant.now().toString());
		vitality.setUpdatedAt(vitality.getCreatedAt());
		vendors.save(vitality);

		VendorAccount account = new VendorAccount();
		account.setId("vac-vitality");
		account.setVendorId(vitality.getId());
		account.setEmail("vendor.vitality@example.com");
		account.setFullName("Vitality Partnerships");
		account.setPasswordHash(passwords.encode("VendorDemo123!"));
		account.setRole("vendor_admin");
		account.setCreatedAt(Instant.now().toString());
		accounts.save(account);

		log.info("Seeded Vitality vendor (login vendor.vitality@example.com / VendorDemo123!)");
	}
}
