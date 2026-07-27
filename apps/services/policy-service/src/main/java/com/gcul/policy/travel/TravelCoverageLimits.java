package com.gcul.policy.travel;

/** Shared Travel Protect Plus coverage and parametric payout limits (GBP). */
public final class TravelCoverageLimits {

	/** Aggregate policy coverage pool when parametric travel cover is selected. */
	public static final double POLICY_LIMIT_GBP = 1_000.0;

	public static final double FLIGHT_DELAY_ITEM_LIMIT_GBP = 1_000.0;

	public static final double TRIP_CANCELLATION_ITEM_LIMIT_GBP = 1_000.0;

	public static final double FLIGHT_DELAY_PAYOUT_GBP = 250.0;

	public static final double TRIP_CANCELLATION_PAYOUT_GBP = 150.0;

	public static final double FLIGHT_DELAY_THRESHOLD_MINUTES = 240.0;

	private TravelCoverageLimits() {
	}
}
