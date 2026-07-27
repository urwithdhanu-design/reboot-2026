package com.gcul.policy.travel;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.gcul.policy.client.ParametricRuleClient;
import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.quote.QuoteService;

@Service
public class TravelParametricProvisioner {

	private static final Logger log = LoggerFactory.getLogger(TravelParametricProvisioner.class);

	private final QuoteService quotes;
	private final ParametricRuleClient parametricRules;

	public TravelParametricProvisioner(QuoteService quotes, ParametricRuleClient parametricRules) {
		this.quotes = quotes;
		this.parametricRules = parametricRules;
	}

	public void provisionForMintedPolicy(PolicyRecord record) {
		if (record == null || !"MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return;
		}
		if (!StringUtils.hasText(record.getQuoteId())) {
			return;
		}

		Map<String, Object> quote;
		try {
			quote = quotes.getQuote(record.getQuoteId());
		}
		catch (Exception ex) {
			log.debug("Quote {} not available for parametric provisioning: {}", record.getQuoteId(), ex.getMessage());
			return;
		}

		if (!"Travel".equalsIgnoreCase(String.valueOf(quote.get("category")))) {
			return;
		}

		@SuppressWarnings("unchecked")
		Map<String, Object> answers = quote.get("answers") instanceof Map<?, ?> map
				? (Map<String, Object>) map
				: Map.of();

		String policyRef = record.getPolicyId();
		String flightNumber = str(answers.get("flight_number"));
		String travelDate = str(answers.get("departure_date"));
		String customerEmail = record.getCustomerEmail();
		String policyExpiresAt = record.getCoverExpiresAt() == null ? "" : record.getCoverExpiresAt().toString();

		if (isYes(answers.get("coverage_flight_delay"))) {
			createRule(
					policyRef,
					"Flight delay · " + firstNonBlank(flightNumber, policyRef),
					"flight_delay",
					"flight_delay_minutes",
					TravelCoverageLimits.FLIGHT_DELAY_THRESHOLD_MINUTES,
					TravelCoverageLimits.FLIGHT_DELAY_PAYOUT_GBP,
					flightNumber,
					travelDate,
					customerEmail,
					policyExpiresAt);
		}

		if (isYes(answers.get("coverage_cancellation"))) {
			createRule(
					policyRef,
					"Trip cancellation · " + firstNonBlank(flightNumber, policyRef),
					"trip_cancellation",
					"trip_cancelled",
					1,
					TravelCoverageLimits.TRIP_CANCELLATION_PAYOUT_GBP,
					flightNumber,
					travelDate,
					customerEmail,
					policyExpiresAt);
		}
	}

	private void createRule(
			String policyRef,
			String name,
			String ruleType,
			String metric,
			double threshold,
			double payout,
			String flightNumber,
			String travelDate,
			String customerEmail,
			String policyExpiresAt) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("policy_ref", policyRef);
		body.put("name", name);
		body.put("rule_type", ruleType);
		body.put("metric", metric);
		body.put("threshold", threshold);
		body.put("comparison", "gte");
		body.put("payout_amount", payout);
		body.put("flight_number", flightNumber);
		body.put("travel_date", travelDate);
		body.put("product_category", "Travel");
		body.put("customer_email", customerEmail);
		if (!policyExpiresAt.isBlank()) {
			body.put("policy_expires_at", policyExpiresAt);
		}
		try {
			Map<String, Object> created = parametricRules.createRule(body);
			log.info("Provisioned {} parametric rule {} for policy {}", ruleType, created.get("id"), policyRef);
		}
		catch (Exception ex) {
			log.warn("Failed to provision {} rule for {}: {}", ruleType, policyRef, ex.getMessage());
		}
	}

	private static boolean isYes(Object value) {
		return "yes".equalsIgnoreCase(str(value));
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (StringUtils.hasText(value)) {
				return value.trim();
			}
		}
		return "";
	}
}
