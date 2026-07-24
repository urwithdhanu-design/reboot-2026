package com.gcul.kyc.cache;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gcul.firestore")
public class FirestoreCacheProperties {

	private boolean enabled = false;
	private String projectId = "";
	private String collection = "gcul_cache";
	/** Max age of admin view cache documents (seconds). */
	private long adminTtlSeconds = 600;

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

	public long getAdminTtlSeconds() {
		return adminTtlSeconds;
	}

	public void setAdminTtlSeconds(long adminTtlSeconds) {
		this.adminTtlSeconds = adminTtlSeconds;
	}
}
