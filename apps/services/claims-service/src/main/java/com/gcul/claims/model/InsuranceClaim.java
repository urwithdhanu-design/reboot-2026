package com.gcul.claims.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "insurance_claims")
public class InsuranceClaim {

	@Id
	private String id;

	@Column(nullable = false)
	private String policyRef;

	@Column(nullable = false)
	private String customerName;

	@Column(nullable = false)
	private String category;

	@Column(nullable = false)
	private String status = "submitted";

	@Column(nullable = false)
	private double amountClaimed;

	@Lob
	private String description;

	@Column(nullable = false)
	private String source = "manual";

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	private Instant updatedAt = Instant.now();

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getPolicyRef() { return policyRef; }
	public void setPolicyRef(String policyRef) { this.policyRef = policyRef; }
	public String getCustomerName() { return customerName; }
	public void setCustomerName(String customerName) { this.customerName = customerName; }
	public String getCategory() { return category; }
	public void setCategory(String category) { this.category = category; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public double getAmountClaimed() { return amountClaimed; }
	public void setAmountClaimed(double amountClaimed) { this.amountClaimed = amountClaimed; }
	public String getDescription() { return description; }
	public void setDescription(String description) { this.description = description; }
	public String getSource() { return source; }
	public void setSource(String source) { this.source = source; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
	public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
