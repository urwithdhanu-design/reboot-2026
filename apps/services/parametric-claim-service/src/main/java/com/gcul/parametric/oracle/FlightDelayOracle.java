package com.gcul.parametric.oracle;

public interface FlightDelayOracle {

	String providerId();

	FlightDelaySnapshot lookup(String flightNumber, String travelDate);
}
