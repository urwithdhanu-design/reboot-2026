package com.gcul.parametric.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "parametric_rules")
public class ParametricRule {

	@Id
	private String id;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String metric;

	@Column(nullable = false)
	private double threshold;

	@Column(nullable = false)
	private String comparison = "gte";

	@Column(nullable = false)
	private double payoutAmount;

	@Column(nullable = false)
	private String policyRef;

	@Column(nullable = false)
	private boolean active = true;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getMetric() { return metric; }
	public void setMetric(String metric) { this.metric = metric; }
	public double getThreshold() { return threshold; }
	public void setThreshold(double threshold) { this.threshold = threshold; }
	public String getComparison() { return comparison; }
	public void setComparison(String comparison) { this.comparison = comparison; }
	public double getPayoutAmount() { return payoutAmount; }
	public void setPayoutAmount(double payoutAmount) { this.payoutAmount = payoutAmount; }
	public String getPolicyRef() { return policyRef; }
	public void setPolicyRef(String policyRef) { this.policyRef = policyRef; }
	public boolean isActive() { return active; }
	public void setActive(boolean active) { this.active = active; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
