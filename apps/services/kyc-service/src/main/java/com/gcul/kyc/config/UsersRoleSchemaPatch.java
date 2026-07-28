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
public class UsersRoleSchemaPatch implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(UsersRoleSchemaPatch.class);

	private final JdbcTemplate jdbc;

	public UsersRoleSchemaPatch(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		try {
			jdbc.execute(
					"ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'customer'");
			jdbc.execute(
					"ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_approval_mode VARCHAR(32)");
			jdbc.execute(
					"ALTER TABLE users ADD COLUMN IF NOT EXISTS current_login_at VARCHAR(40)");
			jdbc.execute(
					"ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at VARCHAR(40)");
			log.info("Ensured users.role, kyc_approval_mode, and login timestamp columns exist");
		}
		catch (Exception ex) {
			log.warn("Could not ensure users schema columns: {}", ex.getMessage());
		}
	}
}
