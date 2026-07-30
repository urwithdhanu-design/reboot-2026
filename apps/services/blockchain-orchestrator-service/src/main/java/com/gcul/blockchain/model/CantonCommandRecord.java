package com.gcul.blockchain.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "canton_command_records")
public class CantonCommandRecord {

	@Id
	@Column(name = "business_key", nullable = false, length = 128)
	private String businessKey;

	@Column(name = "command_type", nullable = false, length = 64)
	private String commandType;

	@Column(name = "command_id", nullable = false, length = 128)
	private String commandId;

	@Column(name = "policy_id", nullable = false, length = 64)
	private String policyId;

	@Column(name = "token_id", length = 128)
	private String tokenId;

	@Column(name = "transaction_hash", length = 256)
	private String transactionHash;

	@Column(name = "ledger_mode", length = 32)
	private String ledgerMode;

	@Column(name = "completed_at", nullable = false)
	private Instant completedAt = Instant.now();

	public String getBusinessKey() {
		return businessKey;
	}

	public void setBusinessKey(String businessKey) {
		this.businessKey = businessKey;
	}

	public String getCommandType() {
		return commandType;
	}

	public void setCommandType(String commandType) {
		this.commandType = commandType;
	}

	public String getCommandId() {
		return commandId;
	}

	public void setCommandId(String commandId) {
		this.commandId = commandId;
	}

	public String getPolicyId() {
		return policyId;
	}

	public void setPolicyId(String policyId) {
		this.policyId = policyId;
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

	public String getLedgerMode() {
		return ledgerMode;
	}

	public void setLedgerMode(String ledgerMode) {
		this.ledgerMode = ledgerMode;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Instant completedAt) {
		this.completedAt = completedAt;
	}
}
