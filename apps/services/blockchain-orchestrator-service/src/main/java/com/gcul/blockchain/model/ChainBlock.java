package com.gcul.blockchain.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "chain_blocks")
public class ChainBlock {

	@Id
	private long height;

	@Column(nullable = false, length = 64)
	private String previousHash;

	@Column(nullable = false, length = 64)
	private String hash;

	@Column(nullable = false, length = 64)
	private String merkleRoot;

	@Column(nullable = false)
	private int transactionCount;

	@Column(nullable = false, length = 32)
	private String consensus = "POA";

	@Column(nullable = false, length = 64)
	private String validatorId;

	@Column(nullable = false, length = 128)
	private String validatorSignature;

	@Column(nullable = false)
	private Instant minedAt = Instant.now();

	public long getHeight() {
		return height;
	}

	public void setHeight(long height) {
		this.height = height;
	}

	public String getPreviousHash() {
		return previousHash;
	}

	public void setPreviousHash(String previousHash) {
		this.previousHash = previousHash;
	}

	public String getHash() {
		return hash;
	}

	public void setHash(String hash) {
		this.hash = hash;
	}

	public String getMerkleRoot() {
		return merkleRoot;
	}

	public void setMerkleRoot(String merkleRoot) {
		this.merkleRoot = merkleRoot;
	}

	public int getTransactionCount() {
		return transactionCount;
	}

	public void setTransactionCount(int transactionCount) {
		this.transactionCount = transactionCount;
	}

	public String getConsensus() {
		return consensus;
	}

	public void setConsensus(String consensus) {
		this.consensus = consensus;
	}

	public String getValidatorId() {
		return validatorId;
	}

	public void setValidatorId(String validatorId) {
		this.validatorId = validatorId;
	}

	public String getValidatorSignature() {
		return validatorSignature;
	}

	public void setValidatorSignature(String validatorSignature) {
		this.validatorSignature = validatorSignature;
	}

	public Instant getMinedAt() {
		return minedAt;
	}

	public void setMinedAt(Instant minedAt) {
		this.minedAt = minedAt;
	}
}
