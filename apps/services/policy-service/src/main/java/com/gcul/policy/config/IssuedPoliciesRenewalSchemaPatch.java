package com.gcul.policy.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class IssuedPoliciesRenewalSchemaPatch implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(IssuedPoliciesRenewalSchemaPatch.class);

	private final JdbcTemplate jdbc;

	public IssuedPoliciesRenewalSchemaPatch(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		addColumnIfMissing("issued_policies", "product_id", "VARCHAR(64)");
		addColumnIfMissing("issued_policies", "quote_answers_json", "VARCHAR(8000)");
		addColumnIfMissing("issued_policies", "predecessor_policy_id", "VARCHAR(64)");
		addColumnIfMissing("issued_policies", "renewed_by_policy_id", "VARCHAR(64)");
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
