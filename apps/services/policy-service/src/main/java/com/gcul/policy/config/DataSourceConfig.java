package com.gcul.policy.config;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceConfig {

	private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

	@Bean
	DataSource dataSource(
			@Value("${gcul.cloud-sql.enabled:false}") boolean cloudSqlEnabled,
			@Value("${gcul.h2.url}") String h2Url,
			@Value("${gcul.h2.username}") String h2Username,
			@Value("${gcul.h2.password:}") String h2Password,
			@Value("${gcul.h2.driver}") String h2Driver,
			@Value("${gcul.cloud-sql.jdbc-url}") String cloudUrl,
			@Value("${gcul.cloud-sql.username}") String cloudUsername,
			@Value("${gcul.cloud-sql.password}") String cloudPassword,
			@Value("${gcul.cloud-sql.driver}") String cloudDriver,
			@Value("${gcul.cloud-sql.instance:}") String cloudInstance) {

		if (cloudSqlEnabled) {
			log.info("Policy datasource: Google Cloud PostgreSQL ({})",
					cloudInstance.isBlank() ? cloudUrl : cloudInstance);
			return DataSourceBuilder.create()
					.driverClassName(cloudDriver)
					.url(resolveCloudUrl(cloudUrl, cloudInstance))
					.username(cloudUsername)
					.password(cloudPassword)
					.build();
		}

		log.info("Policy datasource: H2 ({})", h2Url);
		return DataSourceBuilder.create()
				.driverClassName(h2Driver)
				.url(h2Url)
				.username(h2Username)
				.password(h2Password)
				.build();
	}

	private static String resolveCloudUrl(String jdbcUrl, String instance) {
		if (instance == null || instance.isBlank()) {
			return jdbcUrl;
		}
		String separator = jdbcUrl.contains("?") ? "&" : "?";
		return jdbcUrl + separator
				+ "cloudSqlInstance=" + instance
				+ "&socketFactory=com.google.cloud.sql.postgres.SocketFactory";
	}
}
