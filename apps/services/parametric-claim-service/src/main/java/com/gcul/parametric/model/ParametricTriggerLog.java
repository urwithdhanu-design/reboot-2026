package com.gcul.parametric.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "parametric_trigger_logs")
public class ParametricTriggerLog {

	@Id
	private String id;

	@Column(nullable = false)
	private String ruleId;

	@Column(nullable = false)
	private String policyRef;

	private String flightNumber;

	private String travelDate;

	private double observedValue;

	private boolean matched;

	private boolean claimCreated;

	private String claimId;

	private String status;

	@Column(columnDefinition = "TEXT")
	private String message;

	private String triggerSource = "simulation";

	private String oracleProvider;

	private String flightStatus;

	@Column(nullable = false)
	private Instant triggeredAt = Instant.now();

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getRuleId() { return ruleId; }
	public void setRuleId(String ruleId) { this.ruleId = ruleId; }
	public String getPolicyRef() { return policyRef; }
	public void setPolicyRef(String policyRef) { this.policyRef = policyRef; }
	public String getFlightNumber() { return flightNumber; }
	public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }
	public String getTravelDate() { return travelDate; }
	public void setTravelDate(String travelDate) { this.travelDate = travelDate; }
	public double getObservedValue() { return observedValue; }
	public void setObservedValue(double observedValue) { this.observedValue = observedValue; }
	public boolean isMatched() { return matched; }
	public void setMatched(boolean matched) { this.matched = matched; }
	public boolean isClaimCreated() { return claimCreated; }
	public void setClaimCreated(boolean claimCreated) { this.claimCreated = claimCreated; }
	public String getClaimId() { return claimId; }
	public void setClaimId(String claimId) { this.claimId = claimId; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public String getMessage() { return message; }
	public void setMessage(String message) { this.message = message; }
	public String getTriggerSource() { return triggerSource; }
	public void setTriggerSource(String triggerSource) { this.triggerSource = triggerSource; }
	public String getOracleProvider() { return oracleProvider; }
	public void setOracleProvider(String oracleProvider) { this.oracleProvider = oracleProvider; }
	public String getFlightStatus() { return flightStatus; }
	public void setFlightStatus(String flightStatus) { this.flightStatus = flightStatus; }
	public Instant getTriggeredAt() { return triggeredAt; }
	public void setTriggeredAt(Instant triggeredAt) { this.triggeredAt = triggeredAt; }
}
