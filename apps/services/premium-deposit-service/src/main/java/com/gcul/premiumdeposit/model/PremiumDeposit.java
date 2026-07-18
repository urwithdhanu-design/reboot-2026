package com.gcul.premiumdeposit.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "premium_deposits")
public class PremiumDeposit {

	@Id
	private String id;

	@Column(nullable = false)
	private String policyRef;

	@Column(nullable = false)
	private String customerId;

	@Column(nullable = false)
	private double amount;

	@Column(nullable = false)
	private String currency = "GBP";

	@Column(nullable = false)
	private String status = "held";

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	private Instant releasedAt;

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getPolicyRef() { return policyRef; }
	public void setPolicyRef(String policyRef) { this.policyRef = policyRef; }
	public String getCustomerId() { return customerId; }
	public void setCustomerId(String customerId) { this.customerId = customerId; }
	public double getAmount() { return amount; }
	public void setAmount(double amount) { this.amount = amount; }
	public String getCurrency() { return currency; }
	public void setCurrency(String currency) { this.currency = currency; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
	public Instant getReleasedAt() { return releasedAt; }
	public void setReleasedAt(Instant releasedAt) { this.releasedAt = releasedAt; }
}
