package com.gcul.parametric.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.parametric.client.PolicyLookupClient;
import com.gcul.parametric.messaging.ClaimInitiatedProcessor;
import com.gcul.parametric.model.ParametricRule;
import com.gcul.parametric.oracle.FlightDelayOracleService;
import com.gcul.parametric.repository.ParametricRuleRepository;
import com.gcul.parametric.repository.ParametricTriggerLogRepository;
import com.gcul.parametric.service.FlightDelayOraclePoller;
import com.gcul.parametric.service.FlightDelayPollScheduler;

@Service
public class ParametricTriggerService {

	private final ParametricRuleRepository repo;
	private final ParametricTriggerLogRepository triggerLogs;
	private final PolicyLookupClient policyClient;
	private final ClaimInitiatedProcessor claimProcessor;
	private final FlightDelayOracleService oracle;
	private final FlightDelayOraclePoller oraclePoller;
	private final FlightDelayPollScheduler pollScheduler;

	public ParametricTriggerService(
			ParametricRuleRepository repo,
			ParametricTriggerLogRepository triggerLogs,
			PolicyLookupClient policyClient,
			ClaimInitiatedProcessor claimProcessor,
			FlightDelayOracleService oracle,
			FlightDelayOraclePoller oraclePoller,
			FlightDelayPollScheduler pollScheduler) {
		this.repo = repo;
		this.triggerLogs = triggerLogs;
		this.policyClient = policyClient;
		this.claimProcessor = claimProcessor;
		this.oracle = oracle;
		this.oraclePoller = oraclePoller;
		this.pollScheduler = pollScheduler;
	}

	public Map<String, Object> createRule(Map<String, Object> body) {
		String policyRef = str(body.get("policy_ref"));
		if (policyRef.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policy_ref is required");
		}

		Map<String, Object> policy = policyClient.fetchPolicy(policyRef);
		String ruleType = firstNonBlank(str(body.get("rule_type")), "flight_delay");
		boolean flightDelay = "flight_delay".equalsIgnoreCase(ruleType);
		boolean tripCancellation = "trip_cancellation".equalsIgnoreCase(ruleType);

		var existing = repo.findFirstByPolicyRefAndRuleType(policyRef, ruleType);
		if (existing.isPresent()) {
			return toMap(existing.get());
		}

		ParametricRule rule = new ParametricRule();
		rule.setId("PR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		rule.setName(firstNonBlank(str(body.get("name")),
				flightDelay ? "Flight delay cover"
						: tripCancellation ? "Trip cancellation cover" : "Parametric rule"));
		rule.setRuleType(ruleType);
		rule.setMetric(firstNonBlank(str(body.get("metric")),
				flightDelay ? "flight_delay_minutes"
						: tripCancellation ? "trip_cancelled" : "rainfall_mm"));
		rule.setThreshold(num(body.get("threshold"), flightDelay ? 240 : tripCancellation ? 1 : 50));
		rule.setComparison(firstNonBlank(str(body.get("comparison")), "gte"));
		rule.setPayoutAmount(num(body.get("payout_amount"), flightDelay ? 250 : tripCancellation ? 150 : 500));
		rule.setPolicyRef(policyRef);
		rule.setProductCategory(firstNonBlank(
				str(body.get("product_category")),
				str(policy.get("product_category")),
				"Travel"));
		rule.setFlightNumber(str(body.get("flight_number")));
		rule.setTravelDate(str(body.get("travel_date")));
		rule.setPolicyExpiresAt(firstNonBlank(
				str(body.get("policy_expires_at")),
				PolicyLookupClient.derivePolicyExpiry(policy)));
		rule.setCustomerEmail(firstNonBlank(str(body.get("customer_email")), str(policy.get("customer_email"))));
		rule.setActive(true);
		rule.setOracleStatus("monitoring");
		rule.setCreatedAt(Instant.now());
		return toMap(repo.save(rule));
	}

	public Map<String, Object> oracleStatus() {
		return oracle.status();
	}

	public Map<String, Object> pollOracle(Map<String, Object> body) {
		String ruleId = str(body.get("rule_id"));
		if (!ruleId.isBlank()) {
			return oraclePoller.pollRule(ruleId);
		}
		return pollScheduler.pollActiveRules();
	}

	public Map<String, Object> pollOracleForRule(String ruleId) {
		return oraclePoller.pollRule(ruleId);
	}

	public List<Map<String, Object>> listRules() {
		return repo.findAllByOrderByCreatedAtDesc().stream().map(this::toMap).toList();
	}

	public List<Map<String, Object>> listTriggerLogs() {
		return triggerLogs.findTop50ByOrderByTriggeredAtDesc().stream().map(this::toLogMap).toList();
	}

	/** Legacy generic trigger — publishes ClaimInitiated when threshold met. */
	public Map<String, Object> trigger(Map<String, Object> body) {
		body.putIfAbsent("simulation", true);
		if (body.get("observed_value") != null && body.get("flight_delay_minutes") == null) {
			body.put("flight_delay_minutes", body.get("observed_value"));
		}
		return claimProcessor.initiateAndProcess(body);
	}

	/** Admin simulation: manual delay override for demos. */
	public Map<String, Object> simulateFlightDelay(Map<String, Object> body) {
		body.put("simulation", true);
		body.put("trigger_source", "simulation");
		if (body.get("flight_delay_minutes") == null) {
			body.put("flight_delay_minutes", body.get("observed_value"));
		}
		return claimProcessor.initiateAndProcess(body);
	}

	/** Admin simulation: trip cancellation payout for demos. */
	public Map<String, Object> simulateTripCancellation(Map<String, Object> body) {
		body.put("simulation", true);
		body.put("trigger_source", "simulation");
		body.put("cancellation_confirmed", true);
		body.put("trip_cancelled", true);
		body.put("observed_value", 1);
		body.put("flight_delay_minutes", 1);
		return claimProcessor.initiateAndProcess(body);
	}

	/** Live oracle poll — fetches real delay and auto-triggers when threshold met. */
	public Map<String, Object> triggerFromOracle(Map<String, Object> body) {
		String ruleId = str(body.get("rule_id"));
		if (ruleId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "rule_id is required");
		}
		return oraclePoller.pollRule(ruleId);
	}

	private Map<String, Object> toMap(ParametricRule r) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", r.getId());
		map.put("name", r.getName());
		map.put("rule_type", r.getRuleType());
		map.put("metric", r.getMetric());
		map.put("threshold", r.getThreshold());
		map.put("comparison", r.getComparison());
		map.put("payout_amount", r.getPayoutAmount());
		map.put("policy_ref", r.getPolicyRef());
		map.put("product_category", r.getProductCategory());
		map.put("flight_number", r.getFlightNumber());
		map.put("travel_date", r.getTravelDate());
		map.put("policy_expires_at", r.getPolicyExpiresAt());
		map.put("customer_email", r.getCustomerEmail());
		map.put("active", r.isActive());
		map.put("created_at", r.getCreatedAt().toString());
		map.put("last_polled_at", r.getLastPolledAt() == null ? null : r.getLastPolledAt().toString());
		map.put("last_observed_delay", r.getLastObservedDelay());
		map.put("oracle_status", r.getOracleStatus());
		map.put("oracle_provider", r.getOracleProvider());
		map.put("oracle_message", r.getOracleMessage());
		return map;
	}

	private Map<String, Object> toLogMap(com.gcul.parametric.model.ParametricTriggerLog log) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", log.getId());
		map.put("rule_id", log.getRuleId());
		map.put("policy_ref", log.getPolicyRef());
		map.put("flight_number", log.getFlightNumber());
		map.put("travel_date", log.getTravelDate());
		map.put("observed_value", log.getObservedValue());
		map.put("matched", log.isMatched());
		map.put("claim_created", log.isClaimCreated());
		map.put("claim_id", log.getClaimId());
		map.put("status", log.getStatus());
		map.put("message", log.getMessage());
		map.put("trigger_source", log.getTriggerSource());
		map.put("rule_type", log.getRuleType());
		map.put("oracle_provider", log.getOracleProvider());
		map.put("flight_status", log.getFlightStatus());
		map.put("triggered_at", log.getTriggeredAt().toString());
		return map;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static double num(Object value, double fallback) {
		try {
			return Double.parseDouble(String.valueOf(value));
		}
		catch (Exception ex) {
			return fallback;
		}
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) return value;
		}
		return "";
	}
}
