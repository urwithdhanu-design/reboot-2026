package com.gcul.messaging.spring;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gcul.pubsub")
public class GculPubSubProperties {

	private boolean enabled = false;
	private String projectId = "";
	private String topicPrefix = "gcul";
	private String serviceId = "gcul-unknown";

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

	public String getTopicPrefix() {
		return topicPrefix;
	}

	public void setTopicPrefix(String topicPrefix) {
		this.topicPrefix = topicPrefix;
	}

	public String getServiceId() {
		return serviceId;
	}

	public void setServiceId(String serviceId) {
		this.serviceId = serviceId;
	}
}
