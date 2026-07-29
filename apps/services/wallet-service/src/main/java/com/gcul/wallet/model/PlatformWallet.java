package com.gcul.wallet.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "platform_wallets")
public class PlatformWallet {

	public static final String CLAIMS_POOL_ID = "claims-pool";

	@Id
	@Column(length = 64)
	private String id;

	@Column(nullable = false, length = 120)
	private String label;

	@Column(nullable = false)
	private double balanceGbp = 0.0;

	@Column(length = 8, nullable = false)
	private String currency = "GBP";

	private Instant updatedAt;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getLabel() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
	}

	public double getBalanceGbp() {
		return balanceGbp;
	}

	public void setBalanceGbp(double balanceGbp) {
		this.balanceGbp = balanceGbp;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}
