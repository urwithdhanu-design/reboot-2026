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

	/** e.g. flight_delay_minutes, rainfall_mm */
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
	private String ruleType = "generic";

	private String productCategory;

	private String flightNumber;

	private String travelDate;

	private String policyExpiresAt;

	private String customerEmail;

	@Column(nullable = false)
	private boolean active = true;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	private Instant lastPolledAt;

	private Double lastObservedDelay;

	private String oracleStatus = "idle";

	private String oracleProvider;

	@Column(columnDefinition = "TEXT")
	private String oracleMessage;

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
	public String getRuleType() { return ruleType; }
	public void setRuleType(String ruleType) { this.ruleType = ruleType; }
	public String getProductCategory() { return productCategory; }
	public void setProductCategory(String productCategory) { this.productCategory = productCategory; }
	public String getFlightNumber() { return flightNumber; }
	public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }
	public String getTravelDate() { return travelDate; }
	public void setTravelDate(String travelDate) { this.travelDate = travelDate; }
	public String getPolicyExpiresAt() { return policyExpiresAt; }
	public void setPolicyExpiresAt(String policyExpiresAt) { this.policyExpiresAt = policyExpiresAt; }
	public String getCustomerEmail() { return customerEmail; }
	public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
	public boolean isActive() { return active; }
	public void setActive(boolean active) { this.active = active; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
	public Instant getLastPolledAt() { return lastPolledAt; }
	public void setLastPolledAt(Instant lastPolledAt) { this.lastPolledAt = lastPolledAt; }
	public Double getLastObservedDelay() { return lastObservedDelay; }
	public void setLastObservedDelay(Double lastObservedDelay) { this.lastObservedDelay = lastObservedDelay; }
	public String getOracleStatus() { return oracleStatus; }
	public void setOracleStatus(String oracleStatus) { this.oracleStatus = oracleStatus; }
	public String getOracleProvider() { return oracleProvider; }
	public void setOracleProvider(String oracleProvider) { this.oracleProvider = oracleProvider; }
	public String getOracleMessage() { return oracleMessage; }
	public void setOracleMessage(String oracleMessage) { this.oracleMessage = oracleMessage; }
}
