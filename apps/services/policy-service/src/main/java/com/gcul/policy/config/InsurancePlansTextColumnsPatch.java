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
public class InsurancePlansTextColumnsPatch implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(InsurancePlansTextColumnsPatch.class);

	private static final String[] TEXT_COLUMNS = {
			"title", "description", "tagline", "bullets_json", "cta_label", "category",
			"price_unit", "currency", "icon"
	};

	private final JdbcTemplate jdbc;

	public InsurancePlansTextColumnsPatch(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		for (String column : TEXT_COLUMNS) {
			convertColumn(column);
		}
	}

	private void convertColumn(String column) {
		String quoted = "\"" + column + "\"";
		try {
			jdbc.execute("ALTER TABLE insurance_plans ALTER COLUMN " + quoted
					+ " TYPE TEXT USING convert_from(" + quoted + ", 'UTF8')");
			log.info("insurance_plans.{} converted bytea → text", column);
		}
		catch (Exception fromBytea) {
			try {
				jdbc.execute("ALTER TABLE insurance_plans ALTER COLUMN " + quoted
						+ " TYPE TEXT USING " + quoted + "::text");
				log.info("insurance_plans.{} cast to text", column);
			}
			catch (Exception ignored) {
				log.debug("insurance_plans.{} type OK or not convertible: {}", column, fromBytea.getMessage());
			}
		}
	}
}
