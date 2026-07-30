package com.gcul.blockchain.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "gcul.internal-api")
public class InternalApiProperties {

	/** Shared secret for /api/blockchain/internal/* — empty disables auth (local dev). */
	private String key = "";

	public boolean isProtectionEnabled() {
		return StringUtils.hasText(key);
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key == null ? "" : key.trim();
	}
}
