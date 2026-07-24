package com.gcul.kyc.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "kyc_agent_settings")
public class KycAgentSettings {

	public static final String DEFAULT_ID = "default";

	@Id
	@Column(length = 32)
	private String id = DEFAULT_ID;

	@Column(name = "auto_approve", nullable = false)
	private boolean autoApprove;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public boolean isAutoApprove() {
		return autoApprove;
	}

	public void setAutoApprove(boolean autoApprove) {
		this.autoApprove = autoApprove;
	}
}
