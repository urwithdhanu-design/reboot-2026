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

@Service
public class ClaimInitiatedProcessor {

	private static final Logger log = LoggerFactory.getLogger(ClaimInitiatedProcessor.class);

	private final ParametricRuleRepository rules;
	private final ParametricTriggerLogRepository triggerLogs;
	private final PolicyLookupClient policyClient;
	private final BlockchainClient blockchainClient;
	private final ClaimsClient claimsClient;
	private final ParametricEventPublisher events;

	public ClaimInitiatedProcessor(
			ParametricRuleRepository rules,
			ParametricTriggerLogRepository triggerLogs,
			PolicyLookupClient policyClient,
			BlockchainClient blockchainClient,
			ClaimsClient claimsClient,
			ParametricEventPublisher events) {
		this.rules = rules;
		this.triggerLogs = triggerLogs;
		this.policyClient = policyClient;
		this.blockchainClient = blockchainClient;
		this.claimsClient = claimsClient;
		this.events = events;
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

		if (!travelDate.isBlank() && rule.getTravelDate() != null && !rule.getTravelDate().isBlank()
				&& !travelDate.equals(rule.getTravelDate())) {
			return finishLog(rule, policyRef, flightNumber, travelDate, observed, false, null,
					"skipped", "Travel date does not match rule coverage date", triggerSource, oracleProvider, flightStatus);
		}

		Map<String, Object> policy = policyClient.fetchPolicy(policyRef);
		String expiresAt = firstNonBlank(rule.getPolicyExpiresAt(), PolicyLookupClient.derivePolicyExpiry(policy));
		policyClient.assertEligibleForParametricClaim(policy, travelDate, expiresAt);

		String policyReferenceHash = str(policy.get("policy_reference_hash"));
		Map<String, Object> canton = blockchainClient.verifyCantonPolicy(policyRef, policyReferenceHash);
		blockchainClient.assertVerifiedOnCanton(canton, policy);

		boolean matched = matches(rule, observed);
		if (!matched) {
			return finishLog(rule, policyRef, flightNumber, travelDate, observed, false, null,
					"below_threshold", "Delay " + observed + " min below threshold " + rule.getThreshold(),
					triggerSource, oracleProvider, flightStatus);
		}

		Map<String, Object> chainRecord = blockchainClient.recordClaimInitiated(Map.of(
				"policy_ref", policyRef,
				"policy_reference_hash", policyReferenceHash,
				"rule_id", rule.getId(),
				"flight_number", firstNonBlank(flightNumber, rule.getFlightNumber()),
				"travel_date", firstNonBlank(travelDate, rule.getTravelDate()),
				"flight_delay_minutes", observed,
				"payout_amount", rule.getPayoutAmount(),
				"canton_contract_id", str(canton.get("contractId"))));

		String customerEmail = knownIdentity(firstNonBlank(str(policy.get("customer_email")), rule.getCustomerEmail()));
		String customerId = knownIdentity(str(policy.get("customer_id")));
		String walletAddress = str(policy.get("wallet_address"));
		String description = "Parametric auto-claim: " + rule.getName()
				+ " — flight " + firstNonBlank(flightNumber, rule.getFlightNumber())
				+ " delayed " + observed + " min on " + firstNonBlank(travelDate, rule.getTravelDate());

		Map<String, Object> claimBody = claimsClient.buildClaimRequest(
				policyRef,
				firstNonBlank(customerEmail, "Insured"),
				customerEmail,
				customerId,
				rule.getPayoutAmount(),
				description,
				firstNonBlank(rule.getProductCategory(), "Travel"),
				walletAddress);

		Map<String, Object> claim = claimsClient.createParametricAutoSettle(claimBody);
		log.info("Parametric claim auto-settled {} for policy {} (delay {} min)", claim.get("id"), policyRef, observed);

		Map<String, Object> result = finishLog(rule, policyRef, flightNumber, travelDate, observed, true,
				str(claim.get("id")), str(claim.get("status")), "Auto-approved and settled",
				triggerSource, oracleProvider, flightStatus);
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
			String flightStatus) {
		ParametricTriggerLog logEntry = new ParametricTriggerLog();
		logEntry.setId("PTG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		logEntry.setRuleId(rule.getId());
		logEntry.setPolicyRef(policyRef);
		logEntry.setFlightNumber(firstNonBlank(flightNumber, rule.getFlightNumber()));
		logEntry.setTravelDate(firstNonBlank(travelDate, rule.getTravelDate()));
		logEntry.setObservedValue(observed);
		logEntry.setMatched("below_threshold".equals(status) ? false : matches(rule, observed));
		logEntry.setClaimCreated(claimCreated);
		logEntry.setClaimId(claimId);
		logEntry.setStatus(status);
		logEntry.setMessage(message);
		logEntry.setTriggerSource(firstNonBlank(triggerSource, "simulation"));
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
		return result;
	}

	private Map<String, Object> buildEventPayload(Map<String, Object> body) {
		String ruleId = str(body.get("rule_id"));
		if (ruleId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "rule_id is required");
		}
		ParametricRule rule = rules.findById(ruleId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found"));

		Map<String, Object> event = new LinkedHashMap<>();
		event.put("ruleId", rule.getId());
		event.put("policyRef", rule.getPolicyRef());
		event.put("ruleType", rule.getRuleType());
		event.put("metric", rule.getMetric());
		event.put("threshold", rule.getThreshold());
		event.put("flightNumber", firstNonBlank(str(body.get("flight_number")), rule.getFlightNumber()));
		event.put("travelDate", firstNonBlank(str(body.get("travel_date")), rule.getTravelDate()));
		event.put("observedValue", num(body.get("flight_delay_minutes"), num(body.get("observed_value"), 0)));
		event.put("flightDelayMinutes", event.get("observedValue"));
		event.put("payoutAmount", rule.getPayoutAmount());
		event.put("source", "parametric");
		event.put("trigger_source", firstNonBlank(str(body.get("trigger_source")), "simulation"));
		event.put("oracle_provider", str(body.get("oracle_provider")));
		event.put("flight_status", str(body.get("flight_status")));
		event.put("simulation", Boolean.TRUE.equals(body.get("simulation")) || body.get("simulation") == null);
		return event;
	}

	private static boolean matches(ParametricRule rule, double observed) {
		return switch (rule.getComparison().toLowerCase(Locale.ROOT)) {
			case "gt" -> observed > rule.getThreshold();
			case "lte" -> observed <= rule.getThreshold();
			case "lt" -> observed < rule.getThreshold();
			default -> observed >= rule.getThreshold();
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
