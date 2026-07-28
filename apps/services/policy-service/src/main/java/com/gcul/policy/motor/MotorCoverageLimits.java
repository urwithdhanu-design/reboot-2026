package com.gcul.policy.motor;

/** Motor Protect Plus parametric telematics limits (GBP / g-force). */
public final class MotorCoverageLimits {

	public static final String PRODUCT_ID = "motor-protect-plus";

	/** Aggregate policy coverage pool when telematics accident cover is selected. */
	public static final double POLICY_LIMIT_GBP = 2_000.0;

	public static final double ACCIDENT_ITEM_LIMIT_GBP = 2_000.0;

	public static final double ACCIDENT_DETECTION_PAYOUT_GBP = 500.0;

	/** Impact severity threshold (g-force) for automatic emergency payout. */
	public static final double IMPACT_G_FORCE_THRESHOLD = 3.0;

	private MotorCoverageLimits() {
	}
}
