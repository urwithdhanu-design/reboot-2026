package com.gcul.claims.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** PostgreSQL: legacy @Lob String columns are OID — convert to TEXT for Hibernate reads. */
@Component
@Order(0)
public class ClaimsDescriptionColumnPatch implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ClaimsDescriptionColumnPatch.class);

	private final JdbcTemplate jdbc;

	public ClaimsDescriptionColumnPatch(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!isPostgres()) {
			return;
		}
		String[] attempts = {
				"ALTER TABLE insurance_claims ALTER COLUMN description TYPE TEXT "
						+ "USING convert_from(lo_get(description), 'UTF8')",
				"ALTER TABLE insurance_claims ALTER COLUMN description TYPE TEXT USING description::text",
				"ALTER TABLE insurance_claims ALTER COLUMN description TYPE TEXT "
						+ "USING convert_from(description, 'UTF8')",
		};
		for (String sql : attempts) {
			try {
				jdbc.execute(sql);
				log.info("insurance_claims.description migrated to TEXT");
				return;
			}
			catch (Exception ex) {
				log.debug("description migration attempt skipped: {}", ex.getMessage());
			}
		}
		log.warn("insurance_claims.description could not be migrated; JDBC list uses OID reader");
	}

	private boolean isPostgres() {
		try {
			Integer one = jdbc.queryForObject("SELECT 1", Integer.class);
			return one != null;
		}
		catch (Exception ex) {
			return false;
		}
	}
}
