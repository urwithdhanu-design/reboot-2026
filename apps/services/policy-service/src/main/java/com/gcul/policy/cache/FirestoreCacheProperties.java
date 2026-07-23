package com.gcul.policy.cache;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gcul.firestore")
public class FirestoreCacheProperties {

	private boolean enabled = false;
	private String projectId = "";
	private String collection = "gcul_cache";
	private String marketplaceDocument = "policy_marketplace";
	/** Max age of cached catalog before refresh from SQL (seconds). */
	private long marketplaceTtlSeconds = 3600;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getProjectId() {
		return projectId;
	}

	public void setProjectId(String projectId) {
		this.projectId = projectId;
	}

	public String getCollection() {
		return collection;
	}

	public void setCollection(String collection) {
		this.collection = collection;
	}

	public String getMarketplaceDocument() {
		return marketplaceDocument;
	}

	public void setMarketplaceDocument(String marketplaceDocument) {
		this.marketplaceDocument = marketplaceDocument;
	}

	public long getMarketplaceTtlSeconds() {
		return marketplaceTtlSeconds;
	}

	public void setMarketplaceTtlSeconds(long marketplaceTtlSeconds) {
		this.marketplaceTtlSeconds = marketplaceTtlSeconds;
	}
}
