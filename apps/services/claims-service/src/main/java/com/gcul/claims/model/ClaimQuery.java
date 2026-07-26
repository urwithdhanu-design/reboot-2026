package com.gcul.claims.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "claim_queries")
public class ClaimQuery {

	@Id
	private String id;

	@Column(nullable = false)
	private String claimId;

	@Column(nullable = false)
	private String status = "open";

	@Column(nullable = false, columnDefinition = "TEXT")
	private String adminMessage;

	@Column(columnDefinition = "TEXT")
	private String customerReply;

	@Column(nullable = false)
	private boolean requiresDocuments;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	private Instant answeredAt;

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getClaimId() { return claimId; }
	public void setClaimId(String claimId) { this.claimId = claimId; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public String getAdminMessage() { return adminMessage; }
	public void setAdminMessage(String adminMessage) { this.adminMessage = adminMessage; }
	public String getCustomerReply() { return customerReply; }
	public void setCustomerReply(String customerReply) { this.customerReply = customerReply; }
	public boolean isRequiresDocuments() { return requiresDocuments; }
	public void setRequiresDocuments(boolean requiresDocuments) { this.requiresDocuments = requiresDocuments; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
	public Instant getAnsweredAt() { return answeredAt; }
	public void setAnsweredAt(Instant answeredAt) { this.answeredAt = answeredAt; }
}
