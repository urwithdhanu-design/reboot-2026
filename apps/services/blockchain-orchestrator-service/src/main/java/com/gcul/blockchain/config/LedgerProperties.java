package com.gcul.blockchain.config;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "gcul.ledger")
public class LedgerProperties {

	/** Primary ledger for minting: canton or simulated. */
	private String primary = "canton";

	/** Legacy alias for primary — kept for GCUL_LEDGER_BACKEND deployments */
	private String backend = "canton";

	/** Comma-separated secondary ledger ids for future async mirror (Phase 2) */
	private String secondary = "";

	public String resolvedPrimary() {
		if (StringUtils.hasText(backend) && !backend.equals(primary)) {
			return backend.trim().toLowerCase();
		}
		return StringUtils.hasText(primary) ? primary.trim().toLowerCase() : "canton";
	}

	public List<String> secondaryLedgers() {
		if (!StringUtils.hasText(secondary)) {
			return Collections.emptyList();
		}
		return Arrays.stream(secondary.split(","))
				.map(String::trim)
				.filter(StringUtils::hasText)
				.map(String::toLowerCase)
				.toList();
	}

	public String getPrimary() {
		return primary;
	}

	public void setPrimary(String primary) {
		this.primary = primary;
	}

	public String getBackend() {
		return backend;
	}

	public void setBackend(String backend) {
		this.backend = backend;
	}

	public String getSecondary() {
		return secondary;
	}

	public void setSecondary(String secondary) {
		this.secondary = secondary;
	}
}
