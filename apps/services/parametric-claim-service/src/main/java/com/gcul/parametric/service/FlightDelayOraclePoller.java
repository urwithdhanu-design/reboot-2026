package com.gcul.parametric.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.parametric.messaging.ClaimInitiatedProcessor;
import com.gcul.parametric.model.ParametricRule;
import com.gcul.parametric.oracle.FlightDelayOracleService;
import com.gcul.parametric.oracle.FlightDelaySnapshot;
import com.gcul.parametric.repository.ParametricRuleRepository;
import com.gcul.parametric.repository.ParametricTriggerLogRepository;

@Service
public class FlightDelayOraclePoller {

	private static final Logger log = LoggerFactory.getLogger(FlightDelayOraclePoller.class);

	private final ParametricRuleRepository rules;
	private final ParametricTriggerLogRepository triggerLogs;
	private final FlightDelayOracleService oracle;
	private final ClaimInitiatedProcessor claimProcessor;

	public FlightDelayOraclePoller(
			ParametricRuleRepository rules,
			ParametricTriggerLogRepository triggerLogs,
			FlightDelayOracleService oracle,
			ClaimInitiatedProcessor claimProcessor) {
		this.rules = rules;
		this.triggerLogs = triggerLogs;
		this.oracle = oracle;
		this.claimProcessor = claimProcessor;
	}

	@Transactional
	public Map<String, Object> pollRule(String ruleId) {
		ParametricRule rule = rules.findById(ruleId).orElseThrow(
				() -> new org.springframework.web.server.ResponseStatusException(
						org.springframework.http.HttpStatus.NOT_FOUND,
						"Rule not found: " + ruleId));
		return pollRule(rule, false);
	}

	@Transactional
	public Map<String, Object> pollRule(ParametricRule rule, boolean simulation) {
		if ("trip_cancellation".equalsIgnoreCase(rule.getRuleType())
				|| "trip_cancelled".equalsIgnoreCase(rule.getMetric())) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Oracle polling applies to flight delay rules only — use trip cancellation simulation");
		}
		String flightNumber = rule.getFlightNumber();
		String travelDate = rule.getTravelDate();
		if (flightNumber == null || flightNumber.isBlank()) {
			updateOracleState(rule, 0, "error", oracle.status().get("provider").toString(),
					"Rule has no flight number");
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Rule has no flight number");
		}
		if (travelDate == null || travelDate.isBlank()) {
			updateOracleState(rule, 0, "error", oracle.status().get("provider").toString(),
					"Rule has no travel date");
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Rule has no travel date");
		}

		if (!simulation && triggerLogs.existsByRuleIdAndTravelDateAndClaimCreatedTrue(rule.getId(), travelDate)) {
			Map<String, Object> skipped = new LinkedHashMap<>();
			skipped.put("rule_id", rule.getId());
			skipped.put("skipped", true);
			skipped.put("message", "Claim already auto-settled for this rule and travel date");
			skipped.put("oracle_status", "triggered");
			return skipped;
		}

		FlightDelaySnapshot snapshot = oracle.lookup(flightNumber, travelDate);
		log.info("Oracle {} returned {} min delay for {} on {} (found={})",
				snapshot.provider(),
				snapshot.delayMinutes(),
				snapshot.flightNumber(),
				snapshot.travelDate(),
				snapshot.flightFound());

		if (!snapshot.flightFound()) {
			updateOracleState(rule, snapshot.delayMinutes(), "no_data", snapshot.provider(), snapshot.message());
			Map<String, Object> result = new LinkedHashMap<>();
			result.put("rule_id", rule.getId());
			result.put("matched", false);
			result.put("claim_created", false);
			result.put("oracle", toOracleMap(snapshot));
			result.put("message", snapshot.message());
			result.put("status", "no_data");
			return result;
		}

		updateOracleState(rule, snapshot.delayMinutes(), "monitoring", snapshot.provider(), snapshot.message());

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("rule_id", rule.getId());
		body.put("flight_number", snapshot.flightNumber());
		body.put("travel_date", snapshot.travelDate());
		body.put("flight_delay_minutes", snapshot.delayMinutes());
		body.put("simulation", simulation);
		body.put("trigger_source", simulation ? "simulation" : "oracle_poll");
		body.put("oracle_provider", snapshot.provider());
		body.put("flight_status", snapshot.flightStatus());

		Map<String, Object> processed = claimProcessor.initiateAndProcess(body);
		processed.put("oracle", toOracleMap(snapshot));

		if (Boolean.TRUE.equals(processed.get("claim_created"))) {
			updateOracleState(rule, snapshot.delayMinutes(), "triggered", snapshot.provider(),
					"Auto-claim settled — delay " + snapshot.delayMinutes() + " min");
		}
		else if ("below_threshold".equals(processed.get("status"))) {
			updateOracleState(rule, snapshot.delayMinutes(), "monitoring", snapshot.provider(),
					"Delay " + snapshot.delayMinutes() + " min below threshold " + rule.getThreshold());
		}

		return processed;
	}

	private void updateOracleState(
			ParametricRule rule,
			double observedDelay,
			String status,
			String provider,
			String message) {
		rule.setLastPolledAt(Instant.now());
		rule.setLastObservedDelay(observedDelay);
		rule.setOracleStatus(status);
		rule.setOracleProvider(provider);
		rule.setOracleMessage(message);
		rules.save(rule);
	}

	private static Map<String, Object> toOracleMap(FlightDelaySnapshot snapshot) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("provider", snapshot.provider());
		map.put("flight_number", snapshot.flightNumber());
		map.put("travel_date", snapshot.travelDate());
		map.put("delay_minutes", snapshot.delayMinutes());
		map.put("flight_status", snapshot.flightStatus());
		map.put("scheduled_departure", snapshot.scheduledDeparture());
		map.put("actual_departure", snapshot.actualDeparture());
		map.put("departure_airport", snapshot.departureAirport());
		map.put("arrival_airport", snapshot.arrivalAirport());
		map.put("flight_found", snapshot.flightFound());
		map.put("message", snapshot.message());
		map.put("fetched_at", snapshot.fetchedAt().toString());
		return map;
	}
}
