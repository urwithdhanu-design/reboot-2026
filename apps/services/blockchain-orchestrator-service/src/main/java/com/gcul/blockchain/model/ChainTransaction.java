package com.gcul.blockchain.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "chain_transactions")
public class ChainTransaction {

	@Id
	@Column(length = 36)
	private String id;

	@Column
	private Long blockHeight;

	@Column(nullable = false, length = 40)
	private String type;

	@Column(nullable = false, length = 24)
	private String ledger;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String payloadJson;

	@Column(length = 64)
	private String documentHash;

	@Column(length = 64)
	private String actorId;

	@Column(length = 40)
	private String actorRole;

	@Column(length = 128)
	private String publicKeyBase64;

	@Column(length = 256)
	private String signatureBase64;

	private Double fraudScore;

	@Column(nullable = false, length = 64)
	private String txHash;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public Long getBlockHeight() {
		return blockHeight;
	}

	public void setBlockHeight(Long blockHeight) {
		this.blockHeight = blockHeight;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getLedger() {
		return ledger;
	}

	public void setLedger(String ledger) {
		this.ledger = ledger;
	}

	public String getPayloadJson() {
		return payloadJson;
	}

	public void setPayloadJson(String payloadJson) {
		this.payloadJson = payloadJson;
	}

	public String getDocumentHash() {
		return documentHash;
	}

	public void setDocumentHash(String documentHash) {
		this.documentHash = documentHash;
	}

	public String getActorId() {
		return actorId;
	}

	public void setActorId(String actorId) {
		this.actorId = actorId;
	}

	public String getActorRole() {
		return actorRole;
	}

	public void setActorRole(String actorRole) {
		this.actorRole = actorRole;
	}

	public String getPublicKeyBase64() {
		return publicKeyBase64;
	}

	public void setPublicKeyBase64(String publicKeyBase64) {
		this.publicKeyBase64 = publicKeyBase64;
	}

	public String getSignatureBase64() {
		return signatureBase64;
	}

	public void setSignatureBase64(String signatureBase64) {
		this.signatureBase64 = signatureBase64;
	}

	public Double getFraudScore() {
		return fraudScore;
	}

	public void setFraudScore(Double fraudScore) {
		this.fraudScore = fraudScore;
	}

	public String getTxHash() {
		return txHash;
	}

	public void setTxHash(String txHash) {
		this.txHash = txHash;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}
