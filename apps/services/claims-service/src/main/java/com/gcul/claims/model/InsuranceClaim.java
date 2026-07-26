package com.gcul.claims.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
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

	private String customerId;

	private String customerEmail;

	private String policyReferenceHash;

	private String cantonContractId;

	@Column(nullable = false)
	private String category;

	@Column(nullable = false)
	private String status = ClaimStatus.SUBMITTED;

	@Column(nullable = false)
	private double amountClaimed;

	private Double approvedAmount;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(nullable = false)
	private String source = "manual";

	private String payoutTransactionId;

	private String settlementTransactionId;

	private String rejectionReason;

	@Column(columnDefinition = "TEXT")
	private String validationNotes;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	private Instant updatedAt = Instant.now();

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getPolicyRef() { return policyRef; }
	public void setPolicyRef(String policyRef) { this.policyRef = policyRef; }
	public String getCustomerName() { return customerName; }
	public void setCustomerName(String customerName) { this.customerName = customerName; }
	public String getCustomerId() { return customerId; }
	public void setCustomerId(String customerId) { this.customerId = customerId; }
	public String getCustomerEmail() { return customerEmail; }
	public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
	public String getPolicyReferenceHash() { return policyReferenceHash; }
	public void setPolicyReferenceHash(String policyReferenceHash) { this.policyReferenceHash = policyReferenceHash; }
	public String getCantonContractId() { return cantonContractId; }
	public void setCantonContractId(String cantonContractId) { this.cantonContractId = cantonContractId; }
	public String getCategory() { return category; }
	public void setCategory(String category) { this.category = category; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public double getAmountClaimed() { return amountClaimed; }
	public void setAmountClaimed(double amountClaimed) { this.amountClaimed = amountClaimed; }
	public Double getApprovedAmount() { return approvedAmount; }
	public void setApprovedAmount(Double approvedAmount) { this.approvedAmount = approvedAmount; }
	public String getDescription() { return description; }
	public void setDescription(String description) { this.description = description; }
	public String getSource() { return source; }
	public void setSource(String source) { this.source = source; }
	public String getPayoutTransactionId() { return payoutTransactionId; }
	public void setPayoutTransactionId(String payoutTransactionId) { this.payoutTransactionId = payoutTransactionId; }
	public String getSettlementTransactionId() { return settlementTransactionId; }
	public void setSettlementTransactionId(String settlementTransactionId) { this.settlementTransactionId = settlementTransactionId; }
	public String getRejectionReason() { return rejectionReason; }
	public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
	public String getValidationNotes() { return validationNotes; }
	public void setValidationNotes(String validationNotes) { this.validationNotes = validationNotes; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
	public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
