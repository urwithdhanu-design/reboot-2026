package com.gcul.policy.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@Table(name = "policy_ledger_attestations")
@IdClass(PolicyLedgerAttestationId.class)
public class PolicyLedgerAttestation {

	@Id
	@Column(name = "policy_id", nullable = false)
	private String policyId;

	@Id
	@Column(name = "ledger_id", nullable = false, length = 32)
	private String ledgerId;

	@Column(nullable = false, length = 66)
	private String policyReferenceHash;

	@Column(nullable = false)
	private String tokenId;

	@Column(nullable = false)
	private String transactionHash;

	@Column(nullable = false)
	private String contractRef;

	private Long blockNumber;

	@Column(nullable = false)
	private String network;

	@Column(nullable = false, length = 32)
	private String mintStatus = "MINTED";

	@Column(nullable = false)
	private Instant attestedAt = Instant.now();

	@Column(length = 512)
	private String explorerUrl;

	public String getPolicyId() {
		return policyId;
	}

	public void setPolicyId(String policyId) {
		this.policyId = policyId;
	}

	public String getLedgerId() {
		return ledgerId;
	}

	public void setLedgerId(String ledgerId) {
		this.ledgerId = ledgerId;
	}

	public String getPolicyReferenceHash() {
		return policyReferenceHash;
	}

	public void setPolicyReferenceHash(String policyReferenceHash) {
		this.policyReferenceHash = policyReferenceHash;
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

	public String getContractRef() {
		return contractRef;
	}

	public void setContractRef(String contractRef) {
		this.contractRef = contractRef;
	}

	public Long getBlockNumber() {
		return blockNumber;
	}

	public void setBlockNumber(Long blockNumber) {
		this.blockNumber = blockNumber;
	}

	public String getNetwork() {
		return network;
	}

	public void setNetwork(String network) {
		this.network = network;
	}

	public String getMintStatus() {
		return mintStatus;
	}

	public void setMintStatus(String mintStatus) {
		this.mintStatus = mintStatus;
	}

	public Instant getAttestedAt() {
		return attestedAt;
	}

	public void setAttestedAt(Instant attestedAt) {
		this.attestedAt = attestedAt;
	}

	public String getExplorerUrl() {
		return explorerUrl;
	}

	public void setExplorerUrl(String explorerUrl) {
		this.explorerUrl = explorerUrl;
	}
}
