package com.gcul.parametric.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "gcul.flight-oracle")
public class FlightOracleProperties {

	private boolean enabled = true;

	/** aviationstack | aerodatabox */
	private String provider = "aviationstack";

	private String apiKey = "";

	private String baseUrl = "https://api.aviationstack.com/v1";

	private String aeroDataBoxBaseUrl = "https://aerodatabox.p.rapidapi.com";

	private String aeroDataBoxHost = "aerodatabox.p.rapidapi.com";

	private long pollIntervalMs = 300_000L;

	private boolean pollOnStartup = true;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getProvider() {
		return provider;
	}

	public void setProvider(String provider) {
		this.provider = provider;
	}

	public String getApiKey() {
		return apiKey;
	}

	public void setApiKey(String apiKey) {
		this.apiKey = apiKey;
	}

	public String getBaseUrl() {
		return baseUrl;
	}

	public void setBaseUrl(String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public String getAeroDataBoxBaseUrl() {
		return aeroDataBoxBaseUrl;
	}

	public void setAeroDataBoxBaseUrl(String aeroDataBoxBaseUrl) {
		this.aeroDataBoxBaseUrl = aeroDataBoxBaseUrl;
	}

	public String getAeroDataBoxHost() {
		return aeroDataBoxHost;
	}

	public void setAeroDataBoxHost(String aeroDataBoxHost) {
		this.aeroDataBoxHost = aeroDataBoxHost;
	}

	public long getPollIntervalMs() {
		return pollIntervalMs;
	}

	public void setPollIntervalMs(long pollIntervalMs) {
		this.pollIntervalMs = pollIntervalMs;
	}

	public boolean isPollOnStartup() {
		return pollOnStartup;
	}

	public void setPollOnStartup(boolean pollOnStartup) {
		this.pollOnStartup = pollOnStartup;
	}

	public boolean isConfigured() {
		return apiKey != null && !apiKey.isBlank();
	}
}
