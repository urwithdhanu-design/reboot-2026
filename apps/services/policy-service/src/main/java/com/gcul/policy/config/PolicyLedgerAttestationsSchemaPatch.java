package com.gcul.policy.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class PolicyLedgerAttestationsSchemaPatch implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(PolicyLedgerAttestationsSchemaPatch.class);

	private final JdbcTemplate jdbc;

	public PolicyLedgerAttestationsSchemaPatch(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		addColumnIfMissing("issued_policies", "primary_ledger_id", "VARCHAR(32)");
	}

	private void addColumnIfMissing(String table, String column, String type) {
		try {
			jdbc.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column + " " + type);
			log.info("{}.{} column ensured", table, column);
		}
		catch (Exception ex) {
			log.debug("{}.{} patch skipped: {}", table, column, ex.getMessage());
		}
	}
}
