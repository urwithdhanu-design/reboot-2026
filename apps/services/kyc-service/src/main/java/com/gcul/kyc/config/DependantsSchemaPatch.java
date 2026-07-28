package com.gcul.kyc.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class DependantsSchemaPatch implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DependantsSchemaPatch.class);

	private final JdbcTemplate jdbc;

	public DependantsSchemaPatch(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		try {
			jdbc.execute("""
					CREATE TABLE IF NOT EXISTS user_dependants (
						id VARCHAR(36) NOT NULL PRIMARY KEY,
						user_id VARCHAR(36) NOT NULL,
						full_name VARCHAR(120) NOT NULL,
						date_of_birth VARCHAR(10) NOT NULL,
						relationship VARCHAR(32) NOT NULL,
						created_at VARCHAR(40) NOT NULL,
						updated_at VARCHAR(40)
					)
					""");
			log.info("user_dependants table ensured");
		}
		catch (Exception ex) {
			log.warn("Could not ensure user_dependants table: {}", ex.getMessage());
		}
	}
}
