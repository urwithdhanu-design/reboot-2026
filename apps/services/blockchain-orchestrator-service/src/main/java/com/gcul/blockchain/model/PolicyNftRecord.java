package com.gcul.blockchain.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "policy_nft_records")
public class PolicyNftRecord {

	@Id
	private String policyId;

	@Column(nullable = false, unique = true, length = 66)
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
	private String contractAddress;

	@Column(nullable = false)
	private long chainId;

	@Column(nullable = false)
	private String network;

	@Column(nullable = false, columnDefinition = "CLOB")
	private String tokenUri;

	@Column(nullable = false)
	private long blockNumber;

	@Column(nullable = false)
	private String mintMode;

	@Column(nullable = false)
	private String mintStatus = "MINTED";

	@Column(nullable = false)
	private Instant mintedAt = Instant.now();

	public String getPolicyId() {
		return policyId;
	}

	public void setPolicyId(String policyId) {
		this.policyId = policyId;
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

	public String getContractAddress() {
		return contractAddress;
	}

	public void setContractAddress(String contractAddress) {
		this.contractAddress = contractAddress;
	}

	public long getChainId() {
		return chainId;
	}

	public void setChainId(long chainId) {
		this.chainId = chainId;
	}

	public String getNetwork() {
		return network;
	}

	public void setNetwork(String network) {
		this.network = network;
	}

	public String getTokenUri() {
		return tokenUri;
	}

	public void setTokenUri(String tokenUri) {
		this.tokenUri = tokenUri;
	}

	public long getBlockNumber() {
		return blockNumber;
	}

	public void setBlockNumber(long blockNumber) {
		this.blockNumber = blockNumber;
	}

	public String getMintMode() {
		return mintMode;
	}

	public void setMintMode(String mintMode) {
		this.mintMode = mintMode;
	}

	public String getMintStatus() {
		return mintStatus;
	}

	public void setMintStatus(String mintStatus) {
		this.mintStatus = mintStatus;
	}

	/** @deprecated use {@link #getMintStatus()} */
	@Deprecated
	public String getStatus() {
		return mintStatus;
	}

	/** @deprecated use {@link #setMintStatus(String)} */
	@Deprecated
	public void setStatus(String status) {
		this.mintStatus = status;
	}

	public Instant getMintedAt() {
		return mintedAt;
	}

	public void setMintedAt(Instant mintedAt) {
		this.mintedAt = mintedAt;
	}
}
