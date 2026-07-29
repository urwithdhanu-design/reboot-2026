package com.gcul.policy.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "issued_policies")
public class PolicyRecord {

	@Id
	private String policyId;

	@Column(nullable = false)
	private String policyNumber;

	@Column(nullable = false)
	private String quoteId;

	@Column(nullable = false)
	private String customerId;

	@Column(nullable = false)
	private String customerEmail;

	private String productTitle;

	@Column(nullable = false)
	private String status = "issued";

	private String walletAddress;

	@Column(nullable = false, length = 66)
	private String policyReferenceHash;

	private String metadataUri;

	private String tokenId;

	private String transactionHash;

	private String contractAddress;

	private Long blockNumber;

	private String blockchainNetwork;

	@Column(length = 32)
	private String primaryLedgerId;

	private String mintStatus = "PENDING";

	@Column(length = 512)
	private String mintFailureReason;

	private Instant mintFailedAt;

	private String complianceDecision;
	private String complianceAttestation;
	private Double complianceFraudScore;

	private Instant issuedAt = Instant.now();

	private Instant activatedAt;

	private String productCategory;

	private Instant coverStartAt;

	private Instant coverExpiresAt;

	private Double coverageLimitGbp;

	private Double coverageUsedGbp = 0.0;

	@Column(length = 512)
	private String coverageSummary;

	@Column(length = 4000)
	private String coverageDetailsJson;

	private Instant cancelledAt;

	@Column(length = 64)
	private String cancellationReason;

	@Column(length = 32)
	private String cancellationType;

	@Column(length = 512)
	private String cancellationNote;

	@Column(length = 32)
	private String refundStatus;

	private Double refundAmountGbp;

	@Column(length = 64)
	private String refundPaymentId;

	/** The previous policy when this record was created by a customer renewal. */
	@Column(length = 96)
	private String renewalOfPolicyId;

	private Integer renewalSequence;

	private Instant renewedAt;

	public String getPolicyId() {
		return policyId;
	}

	public void setPolicyId(String policyId) {
		this.policyId = policyId;
	}

	public String getPolicyNumber() {
		return policyNumber;
	}

	public void setPolicyNumber(String policyNumber) {
		this.policyNumber = policyNumber;
	}

	public String getQuoteId() {
		return quoteId;
	}

	public void setQuoteId(String quoteId) {
		this.quoteId = quoteId;
	}

	public String getCustomerId() {
		return customerId;
	}

	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public String getCustomerEmail() {
		return customerEmail;
	}

	public void setCustomerEmail(String customerEmail) {
		this.customerEmail = customerEmail;
	}

	public String getProductTitle() {
		return productTitle;
	}

	public void setProductTitle(String productTitle) {
		this.productTitle = productTitle;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getWalletAddress() {
		return walletAddress;
	}

	public void setWalletAddress(String walletAddress) {
		this.walletAddress = walletAddress;
	}

	public String getPolicyReferenceHash() {
		return policyReferenceHash;
	}

	public void setPolicyReferenceHash(String policyReferenceHash) {
		this.policyReferenceHash = policyReferenceHash;
	}

	public String getMetadataUri() {
		return metadataUri;
	}

	public void setMetadataUri(String metadataUri) {
		this.metadataUri = metadataUri;
	}

	public String getTokenId() {
		return tokenId;
	}

	public void setTokenId(String tokenId) {
		this.tokenId = tokenId;
	}

	public String getTransactionHash() {
		return transactionHash;
	}

	public void setTransactionHash(String transactionHash) {
		this.transactionHash = transactionHash;
	}

	public String getContractAddress() {
		return contractAddress;
	}

	public void setContractAddress(String contractAddress) {
		this.contractAddress = contractAddress;
	}

	public Long getBlockNumber() {
		return blockNumber;
	}

	public void setBlockNumber(Long blockNumber) {
		this.blockNumber = blockNumber;
	}

	public String getBlockchainNetwork() {
		return blockchainNetwork;
	}

	public void setBlockchainNetwork(String blockchainNetwork) {
		this.blockchainNetwork = blockchainNetwork;
	}

	public String getPrimaryLedgerId() {
		return primaryLedgerId;
	}

	public void setPrimaryLedgerId(String primaryLedgerId) {
		this.primaryLedgerId = primaryLedgerId;
	}

	public String getMintStatus() {
		return mintStatus;
	}

	public void setMintStatus(String mintStatus) {
		this.mintStatus = mintStatus;
	}

	public String getMintFailureReason() {
		return mintFailureReason;
	}

	public void setMintFailureReason(String mintFailureReason) {
		this.mintFailureReason = mintFailureReason;
	}

	public Instant getMintFailedAt() {
		return mintFailedAt;
	}

	public void setMintFailedAt(Instant mintFailedAt) {
		this.mintFailedAt = mintFailedAt;
	}

	public String getComplianceDecision() { return complianceDecision; }
	public void setComplianceDecision(String complianceDecision) { this.complianceDecision = complianceDecision; }
	public String getComplianceAttestation() { return complianceAttestation; }
	public void setComplianceAttestation(String complianceAttestation) { this.complianceAttestation = complianceAttestation; }
	public Double getComplianceFraudScore() { return complianceFraudScore; }
	public void setComplianceFraudScore(Double complianceFraudScore) { this.complianceFraudScore = complianceFraudScore; }

	public Instant getIssuedAt() {
		return issuedAt;
	}

	public void setIssuedAt(Instant issuedAt) {
		this.issuedAt = issuedAt;
	}

	public Instant getActivatedAt() {
		return activatedAt;
	}

	public void setActivatedAt(Instant activatedAt) {
		this.activatedAt = activatedAt;
	}

	public String getProductCategory() {
		return productCategory;
	}

	public void setProductCategory(String productCategory) {
		this.productCategory = productCategory;
	}

	public Instant getCoverStartAt() {
		return coverStartAt;
	}

	public void setCoverStartAt(Instant coverStartAt) {
		this.coverStartAt = coverStartAt;
	}

	public Instant getCoverExpiresAt() {
		return coverExpiresAt;
	}

	public void setCoverExpiresAt(Instant coverExpiresAt) {
		this.coverExpiresAt = coverExpiresAt;
	}

	public Double getCoverageLimitGbp() {
		return coverageLimitGbp;
	}

	public void setCoverageLimitGbp(Double coverageLimitGbp) {
		this.coverageLimitGbp = coverageLimitGbp;
	}

	public Double getCoverageUsedGbp() {
		return coverageUsedGbp;
	}

	public void setCoverageUsedGbp(Double coverageUsedGbp) {
		this.coverageUsedGbp = coverageUsedGbp;
	}

	public String getCoverageSummary() {
		return coverageSummary;
	}

	public void setCoverageSummary(String coverageSummary) {
		this.coverageSummary = coverageSummary;
	}

	public String getCoverageDetailsJson() {
		return coverageDetailsJson;
	}

	public void setCoverageDetailsJson(String coverageDetailsJson) {
		this.coverageDetailsJson = coverageDetailsJson;
	}

	public Instant getCancelledAt() {
		return cancelledAt;
	}

	public void setCancelledAt(Instant cancelledAt) {
		this.cancelledAt = cancelledAt;
	}

	public String getCancellationReason() {
		return cancellationReason;
	}

	public void setCancellationReason(String cancellationReason) {
		this.cancellationReason = cancellationReason;
	}

	public String getCancellationType() {
		return cancellationType;
	}

	public void setCancellationType(String cancellationType) {
		this.cancellationType = cancellationType;
	}

	public String getCancellationNote() {
		return cancellationNote;
	}

	public void setCancellationNote(String cancellationNote) {
		this.cancellationNote = cancellationNote;
	}

	public String getRefundStatus() {
		return refundStatus;
	}

	public void setRefundStatus(String refundStatus) {
		this.refundStatus = refundStatus;
	}

	public Double getRefundAmountGbp() {
		return refundAmountGbp;
	}

	public void setRefundAmountGbp(Double refundAmountGbp) {
		this.refundAmountGbp = refundAmountGbp;
	}

	public String getRefundPaymentId() {
		return refundPaymentId;
	}

	public void setRefundPaymentId(String refundPaymentId) {
		this.refundPaymentId = refundPaymentId;
	}

	public String getRenewalOfPolicyId() {
		return renewalOfPolicyId;
	}

	public void setRenewalOfPolicyId(String renewalOfPolicyId) {
		this.renewalOfPolicyId = renewalOfPolicyId;
	}

	public Integer getRenewalSequence() {
		return renewalSequence;
	}

	public void setRenewalSequence(Integer renewalSequence) {
		this.renewalSequence = renewalSequence;
	}

	public Instant getRenewedAt() {
		return renewedAt;
	}

	public void setRenewedAt(Instant renewedAt) {
		this.renewedAt = renewedAt;
	}
}
