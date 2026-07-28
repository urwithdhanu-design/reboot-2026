package com.gcul.policy.motor;

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
public class MotorParametricProvisioner {

	private static final Logger log = LoggerFactory.getLogger(MotorParametricProvisioner.class);

	private final QuoteService quotes;
	private final ParametricRuleClient parametricRules;

	public MotorParametricProvisioner(QuoteService quotes, ParametricRuleClient parametricRules) {
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
			log.debug("Quote {} not available for motor parametric provisioning: {}", record.getQuoteId(), ex.getMessage());
			return;
		}

		if (!MotorCoverageLimits.PRODUCT_ID.equalsIgnoreCase(str(quote.get("product_id")))) {
			return;
		}

		@SuppressWarnings("unchecked")
		Map<String, Object> answers = quote.get("answers") instanceof Map<?, ?> map
				? (Map<String, Object>) map
				: Map.of();

		if (!isYes(answers.get("coverage_accident_detection"))) {
			return;
		}

		String policyRef = record.getPolicyId();
		String vehicleReg = str(answers.get("vehicle_reg"));
		String deviceId = str(answers.get("telematics_device_id"));
		String incidentAnchor = firstNonBlank(str(answers.get("cover_start_date")), todayIso());
		String customerEmail = record.getCustomerEmail();
		String policyExpiresAt = record.getCoverExpiresAt() == null ? "" : record.getCoverExpiresAt().toString();

		createRule(
				policyRef,
				"Telematics accident · " + firstNonBlank(vehicleReg, deviceId, policyRef),
				vehicleReg,
				deviceId,
				incidentAnchor,
				customerEmail,
				policyExpiresAt);
	}

	private void createRule(
			String policyRef,
			String name,
			String vehicleReg,
			String deviceId,
			String incidentDate,
			String customerEmail,
			String policyExpiresAt) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("policy_ref", policyRef);
		body.put("name", name);
		body.put("rule_type", "telematics_accident");
		body.put("metric", "impact_g_force");
		body.put("threshold", MotorCoverageLimits.IMPACT_G_FORCE_THRESHOLD);
		body.put("comparison", "gte");
		body.put("payout_amount", MotorCoverageLimits.ACCIDENT_DETECTION_PAYOUT_GBP);
		body.put("flight_number", vehicleReg);
		body.put("travel_date", incidentDate);
		body.put("product_category", "Vehicle");
		body.put("customer_email", customerEmail);
		body.put("telematics_device_id", deviceId);
		if (!policyExpiresAt.isBlank()) {
			body.put("policy_expires_at", policyExpiresAt);
		}
		try {
			Map<String, Object> created = parametricRules.createRule(body);
			log.info("Provisioned telematics_accident rule {} for policy {}", created.get("id"), policyRef);
		}
		catch (Exception ex) {
			log.warn("Failed to provision telematics rule for {}: {}", policyRef, ex.getMessage());
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

	private static String todayIso() {
		return java.time.LocalDate.now(java.time.ZoneOffset.UTC).toString();
	}
}
