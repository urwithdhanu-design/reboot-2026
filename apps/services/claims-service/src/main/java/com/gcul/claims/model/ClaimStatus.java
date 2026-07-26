package com.gcul.claims.model;

/** Claim lifecycle statuses persisted in {@code insurance_claims.status}. */
public final class ClaimStatus {

	public static final String SUBMITTED = "submitted";
	public static final String IN_REVIEW = "in_review";
	public static final String PENDING_APPROVAL = "pending_approval";
	public static final String APPROVED = "approved";
	public static final String PAYMENT_PENDING = "payment_pending";
	public static final String PAID_OUT = "paid_out";
	public static final String SETTLED = "settled";
	public static final String REJECTED = "rejected";

	/** Legacy alias kept for older rows. */
	public static final String PAID = "paid";

	private ClaimStatus() {
	}

	public static boolean isTerminal(String status) {
		return SETTLED.equals(status) || REJECTED.equals(status) || PAID.equals(status);
	}
}
