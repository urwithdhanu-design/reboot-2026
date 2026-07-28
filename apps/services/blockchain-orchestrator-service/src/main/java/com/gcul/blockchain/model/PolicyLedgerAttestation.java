package com.gcul.blockchain.model;

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
	private String policyNumber;

	@Column(nullable = false)
	private String customerId;

	@Column(nullable = false)
	private String walletAddress;

	@Column(nullable = false)
	private String tokenId;

	@Column(nullable = false)
	private String transactionHash;

	@Column(nullable = false)
	private String contractRef;

	@Column(nullable = false)
	private long chainId;

	@Column(nullable = false)
	private long blockNumber;

	@Column(nullable = false)
	private String network;

	@Column(nullable = false, columnDefinition = "CLOB")
	private String metadataUri;

	@Column(nullable = false, length = 32)
	private String mintStatus = "MINTED";

	@Column(nullable = false)
	private Instant mintedAt = Instant.now();

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

	public String getPolicyNumber() {
		return policyNumber;
	}

	public void setPolicyNumber(String policyNumber) {
		this.policyNumber = policyNumber;
	}

	public String getCustomerId() {
		return customerId;
	}

	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public String getWalletAddress() {
		return walletAddress;
	}

	public void setWalletAddress(String walletAddress) {
		this.walletAddress = walletAddress;
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

	public long getChainId() {
		return chainId;
	}

	public void setChainId(long chainId) {
		this.chainId = chainId;
	}

	public long getBlockNumber() {
		return blockNumber;
	}

	public void setBlockNumber(long blockNumber) {
		this.blockNumber = blockNumber;
	}

	public String getNetwork() {
		return network;
	}

	public void setNetwork(String network) {
		this.network = network;
	}

	public String getMetadataUri() {
		return metadataUri;
	}

	public void setMetadataUri(String metadataUri) {
		this.metadataUri = metadataUri;
	}

	public String getMintStatus() {
		return mintStatus;
	}

	public void setMintStatus(String mintStatus) {
		this.mintStatus = mintStatus;
	}

	public Instant getMintedAt() {
		return mintedAt;
	}

	public void setMintedAt(Instant mintedAt) {
		this.mintedAt = mintedAt;
	}

	public String getExplorerUrl() {
		return explorerUrl;
	}

	public void setExplorerUrl(String explorerUrl) {
		this.explorerUrl = explorerUrl;
	}
}
