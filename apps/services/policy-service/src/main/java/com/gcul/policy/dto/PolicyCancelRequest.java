package com.gcul.policy.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PolicyCancelRequest {

	private String reason;

	@JsonProperty("customer_note")
	private String customerNote;

	@JsonProperty("confirm_refund_amount_gbp")
	private Double confirmRefundAmountGbp;

	public String getReason() {
		return reason;
	}

	public void setReason(String reason) {
		this.reason = reason;
	}

	public String getCustomerNote() {
		return customerNote;
	}

	public void setCustomerNote(String customerNote) {
		this.customerNote = customerNote;
	}

	public Double getConfirmRefundAmountGbp() {
		return confirmRefundAmountGbp;
	}

	public void setConfirmRefundAmountGbp(Double confirmRefundAmountGbp) {
		this.confirmRefundAmountGbp = confirmRefundAmountGbp;
	}
}
