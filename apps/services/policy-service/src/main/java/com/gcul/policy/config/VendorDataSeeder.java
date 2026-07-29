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
	private static final String LOCAL_CUSTOMER_WEB = "http://localhost:5174";

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
		seedVitality();
		seedHomeShield();
	}

	private void seedVitality() {
		var existing = vendors.findByCodeIgnoreCase("vitality");
		if (existing.isPresent()) {
			patchLocalUiUrl(existing.get());
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
		vitality.setUiDeployUrl(localVendorUiUrl("vitality"));
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

	private void seedHomeShield() {
		var existing = vendors.findByCodeIgnoreCase("homeshield");
		if (existing.isPresent()) {
			patchLocalUiUrl(existing.get());
			return;
		}

		InsuranceVendor home = new InsuranceVendor();
		home.setId("vnd-homeshield");
		home.setName("HomeShield");
		home.setCode("homeshield");
		home.setCategories("Home");
		home.setContactEmail("vendor.homeshield@example.com");
		home.setContactName("HomeShield Underwriting");
		home.setDescription("Home and contents insurance partner — HomeShield.");
		home.setWebsiteUrl("https://www.homeshield.example.com");
		home.setStatus("active");
		home.setUiDeployUrl(localVendorUiUrl("homeshield"));
		home.setUiVersion("1.0.0");
		home.setServicesConfigJson(
				"{\"vendor_code\":\"homeshield\",\"apis\":[\"/api/quotes\",\"/api/products\"],\"categories\":\"Home\"}");
		home.setPublishedAt(Instant.now().toString());
		home.setCreatedAt(Instant.now().toString());
		home.setUpdatedAt(home.getCreatedAt());
		vendors.save(home);

		VendorAccount account = new VendorAccount();
		account.setId("vac-homeshield");
		account.setVendorId(home.getId());
		account.setEmail("vendor.homeshield@example.com");
		account.setFullName("HomeShield Underwriting");
		account.setPasswordHash(passwords.encode("VendorDemo123!"));
		account.setRole("vendor_admin");
		account.setCreatedAt(Instant.now().toString());
		accounts.save(account);

		log.info("Seeded HomeShield vendor (login vendor.homeshield@example.com / VendorDemo123!)");
	}

	private void patchLocalUiUrl(InsuranceVendor vendor) {
		String localUrl = localVendorUiUrl(vendor.getCode());
		String current = vendor.getUiDeployUrl();
		if (current == null || current.contains("vendors.reboot2026.local")) {
			vendor.setUiDeployUrl(localUrl);
			vendor.setUpdatedAt(Instant.now().toString());
			vendors.save(vendor);
			log.info("Updated {} UI deploy URL to {}", vendor.getCode(), localUrl);
		}
	}

	private static String localVendorUiUrl(String code) {
		return LOCAL_CUSTOMER_WEB + "/vendors/" + code.trim().toLowerCase();
	}
}
