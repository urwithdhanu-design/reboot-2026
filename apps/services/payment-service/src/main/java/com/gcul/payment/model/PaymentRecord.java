package com.gcul.payment.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment_records")
public class PaymentRecord {

	@Id
	private String id;

	@Column(nullable = false)
	private String quoteId;

	@Column(nullable = false)
	private String policyRef;

	@Column(nullable = false)
	private String customerEmail;

	@Column(nullable = false)
	private double amount;

	@Column(nullable = false)
	private String currency = "GBP";

	@Column(nullable = false)
	private String status = "pending";

	@Column(nullable = false)
	private String provider = "stripe";

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	private Instant updatedAt = Instant.now();

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getQuoteId() { return quoteId; }
	public void setQuoteId(String quoteId) { this.quoteId = quoteId; }
	public String getPolicyRef() { return policyRef; }
	public void setPolicyRef(String policyRef) { this.policyRef = policyRef; }
	public String getCustomerEmail() { return customerEmail; }
	public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
	public double getAmount() { return amount; }
	public void setAmount(double amount) { this.amount = amount; }
	public String getCurrency() { return currency; }
	public void setCurrency(String currency) { this.currency = currency; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public String getProvider() { return provider; }
	public void setProvider(String provider) { this.provider = provider; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
	public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
