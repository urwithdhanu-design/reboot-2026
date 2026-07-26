package com.gcul.parametric.oracle;

import java.time.Instant;

public record FlightDelaySnapshot(
		String flightNumber,
		String travelDate,
		int delayMinutes,
		String flightStatus,
		String scheduledDeparture,
		String actualDeparture,
		String arrivalAirport,
		String departureAirport,
		String provider,
		boolean flightFound,
		String message,
		Instant fetchedAt) {

	public static FlightDelaySnapshot notFound(String flightNumber, String travelDate, String provider, String message) {
		return new FlightDelaySnapshot(
				flightNumber,
				travelDate,
				0,
				"not_found",
				null,
				null,
				null,
				null,
				provider,
				false,
				message,
				Instant.now());
	}

	public static FlightDelaySnapshot error(String flightNumber, String travelDate, String provider, String message) {
		return new FlightDelaySnapshot(
				flightNumber,
				travelDate,
				0,
				"error",
				null,
				null,
				null,
				null,
				provider,
				false,
				message,
				Instant.now());
	}
}
