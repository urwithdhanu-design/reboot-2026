package com.gcul.parametric.messaging;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.parametric.client.BlockchainClient;
import com.gcul.parametric.client.ClaimsClient;
import com.gcul.parametric.client.PolicyLookupClient;
import com.gcul.parametric.model.ParametricRule;
import com.gcul.parametric.model.ParametricTriggerLog;
import com.gcul.parametric.repository.ParametricRuleRepository;
import com.gcul.parametric.repository.ParametricTriggerLogRepository;
import com.gcul.parametric.service.ParametricRuleConflictService;

@Service
public class ClaimInitiatedProcessor {

	private static final Logger log = LoggerFactory.getLogger(ClaimInitiatedProcessor.class);

	private final ParametricRuleRepository rules;
	private final ParametricTriggerLogRepository triggerLogs;
	private final PolicyLookupClient policyClient;
	private final BlockchainClient blockchainClient;
	private final ClaimsClient claimsClient;
	private final ParametricEventPublisher events;
	private final ParametricRuleConflictService conflicts;

	public ClaimInitiatedProcessor(
			ParametricRuleRepository rules,
			ParametricTriggerLogRepository triggerLogs,
			PolicyLookupClient policyClient,
			BlockchainClient blockchainClient,
			ClaimsClient claimsClient,
			ParametricEventPublisher events,
			ParametricRuleConflictService conflicts) {
		this.rules = rules;
		this.triggerLogs = triggerLogs;
		this.policyClient = policyClient;
		this.blockchainClient = blockchainClient;
		this.claimsClient = claimsClient;
		this.events = events;
		this.conflicts = conflicts;
	}

	/** Publish ClaimInitiated and process synchronously (admin simulation). */
	@Transactional
	public Map<String, Object> initiateAndProcess(Map<String, Object> body) {
		Map<String, Object> event = buildEventPayload(body);
		Map<String, Object> result = processClaimInitiated(event);
		event.put("processed", true);
		event.put("claim_id", result.get("claim_id"));
		event.put("status", result.get("status"));
		events.claimInitiated(event);
		return result;
	}

	@Transactional
	public Map<String, Object> processClaimInitiated(Map<String, Object> payload) {
		String ruleId = str(payload.get("ruleId"));
		String policyRef = str(payload.get("policyRef"));
		double observed = num(payload.get("observedValue"), num(payload.get("flightDelayMinutes"), 0));
		String travelDate = str(payload.get("travelDate"));
		String flightNumber = str(payload.get("flightNumber"));
		String triggerSource = firstNonBlank(str(payload.get("trigger_source")), "simulation");
		String oracleProvider = str(payload.get("oracle_provider"));
		String flightStatus = str(payload.get("flight_status"));

		ParametricRule rule = rules.findById(ruleId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found: " + ruleId));
		if (!rule.isActive()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rule is inactive");
		}
		if (!policyRef.isBlank() && !policyRef.equalsIgnoreCase(rule.getPolicyRef())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Policy ref does not match rule");
		}
		policyRef = rule.getPolicyRef();
		String effectiveFlight = firstNonBlank(flightNumber, rule.getFlightNumber());
		String effectiveTravelDate = firstNonBlank(travelDate, rule.getTravelDate());
		double effectiveThreshold = num(payload.get("threshold"), rule.getThreshold());

		if (!effectiveTravelDate.isBlank()
				&& triggerLogs.existsByRuleIdAndTravelDateAndClaimCreatedTrue(rule.getId(), effectiveTravelDate)) {
			return finishLog(rule, policyRef, effectiveFlight, effectiveTravelDate, observed, false, null,
					"already_settled", "Claim already auto-settled for this rule and travel date",
					triggerSource, oracleProvider, flightStatus, effectiveThreshold);
		}

		if (!effectiveTravelDate.isBlank() && rule.getTravelDate() != null && !rule.getTravelDate().isBlank()
				&& !effectiveTravelDate.equals(rule.getTravelDate())) {
			return finishLog(rule, policyRef, effectiveFlight, effectiveTravelDate, observed, false, null,
					"skipped", "Travel date does not match rule coverage date (" + rule.getTravelDate() + ")",
					triggerSource, oracleProvider, flightStatus, effectiveThreshold);
		}

		String conflict = conflicts.blockReasonForFlightDelay(rule, effectiveFlight, effectiveTravelDate);
		if (conflict != null) {
			return finishLog(rule, policyRef, effectiveFlight, effectiveTravelDate, observed, false, null,
					"blocked", conflict, triggerSource, oracleProvider, flightStatus, effectiveThreshold);
		}

		Map<String, Object> policy = policyClient.fetchPolicy(policyRef);
		String expiresAt = firstNonBlank(rule.getPolicyExpiresAt(), PolicyLookupClient.derivePolicyExpiry(policy));
		policyClient.assertEligibleForParametricClaim(policy, travelDate, expiresAt);

		String policyReferenceHash = str(policy.get("policy_reference_hash"));
		Map<String, Object> canton = blockchainClient.verifyCantonPolicy(policyRef, policyReferenceHash);
		blockchainClient.assertVerifiedOnCanton(canton, policy);

		boolean matched = matches(rule, observed, effectiveThreshold);
		if (!matched) {
			String detail = thresholdDetail(rule, observed, effectiveThreshold);
			return finishLog(rule, policyRef, effectiveFlight, effectiveTravelDate, observed, false, null,
					"below_threshold", detail,
					triggerSource, oracleProvider, flightStatus, effectiveThreshold);
		}

		Map<String, Object> chainPayload = new LinkedHashMap<>();
		chainPayload.put("policy_ref", policyRef);
		chainPayload.put("policy_reference_hash", policyReferenceHash);
		chainPayload.put("rule_id", rule.getId());
		chainPayload.put("flight_number", effectiveFlight);
		chainPayload.put("travel_date", effectiveTravelDate);
		chainPayload.put("payout_amount", rule.getPayoutAmount());
		chainPayload.put("canton_contract_id", str(canton.get("contractId")));
		if ("trip_cancellation".equalsIgnoreCase(rule.getRuleType())) {
			chainPayload.put("trip_cancelled", true);
			chainPayload.put("claim_type", "trip_cancellation");
		}
		else if ("telematics_accident".equalsIgnoreCase(rule.getRuleType())) {
			chainPayload.put("impact_g_force", observed);
			chainPayload.put("claim_type", "telematics_accident");
			chainPayload.put("vehicle_reg", effectiveFlight);
		}
		else {
			chainPayload.put("flight_delay_minutes", observed);
		}
		Map<String, Object> chainRecord = blockchainClient.recordClaimInitiated(chainPayload);

		String customerEmail = knownIdentity(firstNonBlank(str(policy.get("customer_email")), rule.getCustomerEmail()));
		String customerId = knownIdentity(str(policy.get("customer_id")));
		String walletAddress = str(policy.get("wallet_address"));
		String description = claimDescription(rule, effectiveFlight, effectiveTravelDate, observed);
		String claimCategory = claimCategory(rule);

		Map<String, Object> claimBody = claimsClient.buildClaimRequest(
				policyRef,
				firstNonBlank(customerEmail, "Insured"),
				customerEmail,
				customerId,
				rule.getPayoutAmount(),
				description,
				claimCategory,
				walletAddress,
				rule.getRuleType());

		Map<String, Object> claim = claimsClient.createParametricAutoSettle(claimBody);
		if ("trip_cancellation".equalsIgnoreCase(rule.getRuleType())) {
			log.info("Parametric trip cancellation claim auto-settled {} for policy {}", claim.get("id"), policyRef);
		}
		else if ("telematics_accident".equalsIgnoreCase(rule.getRuleType())) {
			log.info("Parametric telematics accident claim auto-settled {} for policy {} ({}g impact)", claim.get("id"),
					policyRef, observed);
		}
		else {
			log.info("Parametric flight delay claim auto-settled {} for policy {} ({} min)", claim.get("id"), policyRef, observed);
		}

		Map<String, Object> result = finishLog(rule, policyRef, effectiveFlight, effectiveTravelDate, observed, true,
				str(claim.get("id")), str(claim.get("status")), "Auto-approved and settled",
				triggerSource, oracleProvider, flightStatus, effectiveThreshold);
		result.put("claim", claim);
		result.put("chain", chainRecord);
		result.put("matched", true);
		return result;
	}

	private Map<String, Object> finishLog(
			ParametricRule rule,
			String policyRef,
			String flightNumber,
			String travelDate,
			double observed,
			boolean claimCreated,
			String claimId,
			String status,
			String message,
			String triggerSource,
			String oracleProvider,
			String flightStatus,
			double effectiveThreshold) {
		ParametricTriggerLog logEntry = new ParametricTriggerLog();
		logEntry.setId("PTG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		logEntry.setRuleId(rule.getId());
		logEntry.setPolicyRef(policyRef);
		logEntry.setFlightNumber(firstNonBlank(flightNumber, rule.getFlightNumber()));
		logEntry.setTravelDate(firstNonBlank(travelDate, rule.getTravelDate()));
		logEntry.setObservedValue(observed);
		logEntry.setMatched("below_threshold".equals(status) || "blocked".equals(status) || "skipped".equals(status)
				? false
				: matches(rule, observed, effectiveThreshold));
		logEntry.setClaimCreated(claimCreated);
		logEntry.setClaimId(claimId);
		logEntry.setStatus(status);
		logEntry.setMessage(message);
		logEntry.setTriggerSource(firstNonBlank(triggerSource, "simulation"));
		logEntry.setRuleType(rule.getRuleType());
		logEntry.setOracleProvider(oracleProvider);
		logEntry.setFlightStatus(flightStatus);
		logEntry.setTriggeredAt(Instant.now());
		triggerLogs.save(logEntry);

		Map<String, Object> result = new LinkedHashMap<>();
		result.put("trigger_id", logEntry.getId());
		result.put("rule_id", rule.getId());
		result.put("policy_ref", policyRef);
		result.put("matched", logEntry.isMatched());
		result.put("claim_created", claimCreated);
		result.put("claim_id", claimId);
		result.put("status", status);
		result.put("message", message);
		result.put("observed_value", observed);
		result.put("threshold", effectiveThreshold);
		return result;
	}

	private Map<String, Object> buildEventPayload(Map<String, Object> body) {
		String ruleId = str(body.get("rule_id"));
		if (ruleId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "rule_id is required");
		}
		ParametricRule rule = rules.findById(ruleId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found"));

		double effectiveThreshold = num(body.get("threshold"), rule.getThreshold());

		Map<String, Object> event = new LinkedHashMap<>();
		event.put("ruleId", rule.getId());
		event.put("policyRef", rule.getPolicyRef());
		event.put("ruleType", rule.getRuleType());
		event.put("metric", rule.getMetric());
		event.put("threshold", effectiveThreshold);
		event.put("flightNumber", firstNonBlank(str(body.get("flight_number")), rule.getFlightNumber()));
		event.put("travelDate", firstNonBlank(str(body.get("travel_date")), rule.getTravelDate()));
		double observed = observedValue(rule, body);
		event.put("observedValue", observed);
		event.put("flightDelayMinutes", observed);
		event.put("payoutAmount", rule.getPayoutAmount());
		event.put("source", "parametric");
		event.put("trigger_source", firstNonBlank(str(body.get("trigger_source")), "simulation"));
		event.put("oracle_provider", str(body.get("oracle_provider")));
		event.put("flight_status", str(body.get("flight_status")));
		event.put("simulation", Boolean.TRUE.equals(body.get("simulation")) || body.get("simulation") == null);
		return event;
	}

	private static double observedValue(ParametricRule rule, Map<String, Object> body) {
		if ("trip_cancellation".equalsIgnoreCase(rule.getRuleType())
				|| Boolean.TRUE.equals(body.get("cancellation_confirmed"))
				|| Boolean.TRUE.equals(body.get("trip_cancelled"))) {
			return 1;
		}
		if ("telematics_accident".equalsIgnoreCase(rule.getRuleType())) {
			return num(body.get("impact_g_force"), num(body.get("observed_value"), 0));
		}
		return num(body.get("flight_delay_minutes"), num(body.get("observed_value"), 0));
	}

	private static String thresholdDetail(ParametricRule rule, double observed, double effectiveThreshold) {
		if ("trip_cancellation".equalsIgnoreCase(rule.getRuleType())) {
			return "Trip not marked cancelled for rule threshold";
		}
		if ("telematics_accident".equalsIgnoreCase(rule.getRuleType())) {
			return "Impact " + observed + "g below threshold " + effectiveThreshold + "g";
		}
		return "Delay " + observed + " min below threshold " + effectiveThreshold;
	}

	private static String claimDescription(ParametricRule rule, String effectiveFlight, String effectiveTravelDate,
			double observed) {
		if ("trip_cancellation".equalsIgnoreCase(rule.getRuleType())) {
			return "Parametric auto-claim: " + rule.getName()
					+ " — trip cancelled for flight " + effectiveFlight
					+ " on " + effectiveTravelDate;
		}
		if ("telematics_accident".equalsIgnoreCase(rule.getRuleType())) {
			return "Parametric auto-claim: " + rule.getName()
					+ " — telematics impact " + observed + "g detected for vehicle "
					+ effectiveFlight + " on " + effectiveTravelDate;
		}
		return "Parametric auto-claim: " + rule.getName()
				+ " — flight " + effectiveFlight
				+ " delayed " + observed + " min on " + effectiveTravelDate;
	}

	private static String claimCategory(ParametricRule rule) {
		if ("trip_cancellation".equalsIgnoreCase(rule.getRuleType())) {
			return "Trip cancellation";
		}
		if ("telematics_accident".equalsIgnoreCase(rule.getRuleType())) {
			return "Telematics accident";
		}
		return "Flight delay";
	}

	private static boolean matches(ParametricRule rule, double observed, double threshold) {
		if ("trip_cancellation".equalsIgnoreCase(rule.getRuleType())) {
			return observed >= 1;
		}
		return switch (rule.getComparison().toLowerCase(Locale.ROOT)) {
			case "gt" -> observed > threshold;
			case "lte" -> observed <= threshold;
			case "lt" -> observed < threshold;
			default -> observed >= threshold;
		};
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
			if (value != null && !value.isBlank()) {
				return value.trim();
			}
		}
		return "";
	}

	private static String knownIdentity(String value) {
		if (value == null || value.isBlank()) {
			return "";
		}
		String normalized = value.trim().toLowerCase(Locale.ROOT);
		if (normalized.equals("unknown") || normalized.equals("n/a") || normalized.equals("-")) {
			return "";
		}
		return value.trim();
	}
}
