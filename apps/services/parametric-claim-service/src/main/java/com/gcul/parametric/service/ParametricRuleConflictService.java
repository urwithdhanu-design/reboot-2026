package com.gcul.parametric.service;

import org.springframework.stereotype.Service;

import com.gcul.parametric.model.ParametricRule;
import com.gcul.parametric.repository.ParametricTriggerLogRepository;

@Service
public class ParametricRuleConflictService {

	private final ParametricTriggerLogRepository triggerLogs;

	public ParametricRuleConflictService(ParametricTriggerLogRepository triggerLogs) {
		this.triggerLogs = triggerLogs;
	}

	/**
	 * Trip cancellation voids flight delay for the same policy, flight, and travel date.
	 * Flight delay does not block a later cancellation claim (coverage limit enforced by claims-service).
	 */
	public String blockReasonForFlightDelay(ParametricRule rule, String flightNumber, String travelDate) {
		if (!"flight_delay".equalsIgnoreCase(rule.getRuleType())) {
			return null;
		}
		String flight = normalizeFlight(flightNumber, rule.getFlightNumber());
		String date = firstNonBlank(travelDate, rule.getTravelDate());
		if (flight.isBlank() || date.isBlank()) {
			return null;
		}
		if (triggerLogs.existsByPolicyRefAndFlightNumberIgnoreCaseAndTravelDateAndRuleTypeAndClaimCreatedTrue(
				rule.getPolicyRef(), flight, date, "trip_cancellation")) {
			return "Trip cancellation already claimed for flight " + flight + " on " + date
					+ " — flight delay is not payable for this trip";
		}
		return null;
	}

	private static String normalizeFlight(String flightNumber, String ruleFlight) {
		return firstNonBlank(flightNumber, ruleFlight).trim().toUpperCase(java.util.Locale.ROOT);
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value.trim();
			}
		}
		return "";
	}
}
