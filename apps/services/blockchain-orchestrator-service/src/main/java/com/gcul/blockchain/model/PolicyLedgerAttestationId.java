package com.gcul.blockchain.model;

import java.io.Serializable;
import java.util.Objects;

public class PolicyLedgerAttestationId implements Serializable {

	private String policyId;
	private String ledgerId;

	public PolicyLedgerAttestationId() {
	}

	public PolicyLedgerAttestationId(String policyId, String ledgerId) {
		this.policyId = policyId;
		this.ledgerId = ledgerId;
	}

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

	@Override
	public boolean equals(Object o) {
		if (this == o) {
			return true;
		}
		if (!(o instanceof PolicyLedgerAttestationId that)) {
			return false;
		}
		return Objects.equals(policyId, that.policyId) && Objects.equals(ledgerId, that.ledgerId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(policyId, ledgerId);
	}
}
