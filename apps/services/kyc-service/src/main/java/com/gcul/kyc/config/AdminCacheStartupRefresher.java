package com.gcul.kyc.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.gcul.kyc.admin.AdminCustomerService;
import com.gcul.kyc.cache.AdminViewCache;

/**
 * Writes {@code gcul_cache/admin_customers} and {@code admin_kyc_queue} on startup
 * (same pattern as policy-service → {@code policy_marketplace}).
 */
@Component
@Order(20)
public class AdminCacheStartupRefresher implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminCacheStartupRefresher.class);

	private final AdminCustomerService adminCustomers;
	private final AdminViewCache adminCache;

	public AdminCacheStartupRefresher(AdminCustomerService adminCustomers, AdminViewCache adminCache) {
		this.adminCustomers = adminCustomers;
		this.adminCache = adminCache;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!adminCache.isActive()) {
			log.info("Firestore admin cache inactive — skipping startup refresh (check GCUL_FIRESTORE_ENABLED/PROJECT)");
			return;
		}
		adminCustomers.refreshAdminViewCaches();
		log.info("Firestore admin cache refreshed on startup ({}/{})",
				adminCache.isActive() ? "gcul_cache" : "n/a",
				AdminViewCache.DOC_CUSTOMERS + ", " + AdminViewCache.DOC_KYC_QUEUE);
	}
}
