package com.gcul.wallet.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class WalletSchemaPatch implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(WalletSchemaPatch.class);

	private final JdbcTemplate jdbc;

	public WalletSchemaPatch(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		patchCustomerWallets();
		ensureWalletConsentTokensTable();
	}

	private void patchCustomerWallets() {
		addColumn("customer_wallets", "user_email", "VARCHAR(255)");
		addColumn("customer_wallets", "balance_gbp", "DOUBLE PRECISION NOT NULL DEFAULT 0");
		addColumn("customer_wallets", "currency", "VARCHAR(8) NOT NULL DEFAULT 'GBP'");
		addColumn("customer_wallets", "provider", "VARCHAR(64)");
		addColumn("customer_wallets", "mode", "VARCHAR(32)");
		addColumn("customer_wallets", "note", "VARCHAR(255)");
		addColumn("customer_wallets", "consent_approved_at", "TIMESTAMP");
	}

	private void ensureWalletConsentTokensTable() {
		try {
			jdbc.execute("""
					CREATE TABLE IF NOT EXISTS wallet_consent_tokens (
						token_hash VARCHAR(64) NOT NULL PRIMARY KEY,
						user_id VARCHAR(36) NOT NULL,
						expires_at TIMESTAMP NOT NULL,
						used_at TIMESTAMP,
						created_at TIMESTAMP NOT NULL
					)
					""");
			log.info("wallet_consent_tokens table ensured");
		}
		catch (Exception ex) {
			log.warn("Could not ensure wallet_consent_tokens table: {}", ex.getMessage());
		}
	}

	private void addColumn(String table, String column, String type) {
		try {
			jdbc.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column + " " + type);
			log.info("{}.{} column ensured", table, column);
		}
		catch (Exception ex) {
			log.warn("Could not ensure {}.{}: {}", table, column, ex.getMessage());
		}
	}
}
