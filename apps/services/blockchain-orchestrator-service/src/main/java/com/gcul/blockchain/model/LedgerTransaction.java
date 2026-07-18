package com.gcul.blockchain.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ledger_transactions")
public class LedgerTransaction {

	@Id
	private String id;

	@Column(nullable = false)
	private String type;

	@Column(nullable = false)
	private String fromWallet;

	@Column(nullable = false)
	private String toWallet;

	@Column(nullable = false)
	private double amount;

	@Column(nullable = false)
	private String asset = "GBP";

	@Column(nullable = false)
	private String status = "confirmed";

	@Column(nullable = false)
	private String reference;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getType() { return type; }
	public void setType(String type) { this.type = type; }
	public String getFromWallet() { return fromWallet; }
	public void setFromWallet(String fromWallet) { this.fromWallet = fromWallet; }
	public String getToWallet() { return toWallet; }
	public void setToWallet(String toWallet) { this.toWallet = toWallet; }
	public double getAmount() { return amount; }
	public void setAmount(double amount) { this.amount = amount; }
	public String getAsset() { return asset; }
	public void setAsset(String asset) { this.asset = asset; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public String getReference() { return reference; }
	public void setReference(String reference) { this.reference = reference; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
