package com.gcul.policy.policy;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;
import com.gcul.policy.client.ClaimsInternalClient;
import com.gcul.policy.client.PaymentLedgerClient;
import com.gcul.policy.mail.MailService;
import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.quote.QuoteService;

@Service
public class PolicyCancellationService {

	private static final int COOLING_OFF_DAYS = 14;

	private final PolicyRecordService policyRecords;
	private final QuoteService quotes;
	private final ClaimsInternalClient claimsClient;
	private final PaymentLedgerClient paymentLedger;
	private final GculEventPublisher publisher;
	private final MailService mail;

	public PolicyCancellationService(
			PolicyRecordService policyRecords,
			QuoteService quotes,
			ClaimsInternalClient claimsClient,
			PaymentLedgerClient paymentLedger,
			GculEventPublisher publisher,
			MailService mail) {
		this.policyRecords = policyRecords;
		this.quotes = quotes;
		this.claimsClient = claimsClient;
		this.paymentLedger = paymentLedger;
		this.publisher = publisher;
		this.mail = mail;
	}

	public Map<String, Object> previewCancel(String policyId, String customerId, String customerEmail) {
		PolicyRecord record = requireOwnedPolicy(policyId, customerId, customerEmail);
		return buildPreview(record);
	}

	public Map<String, Object> executeCancel(
			String policyId,
			String customerId,
			String customerEmail,
			String reason,
			String customerNote,
			Double confirmRefundAmountGbp) {
		PolicyRecord record = requireOwnedPolicy(policyId, customerId, customerEmail);
		Map<String, Object> preview = buildPreview(record);
		if (!Boolean.TRUE.equals(preview.get("eligible"))) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					String.valueOf(preview.getOrDefault("ineligible_reason", "Policy cannot be cancelled")));
		}

		double refundEstimate = num(preview.get("refund_estimate_gbp"));
		if (confirmRefundAmountGbp == null
				|| Math.abs(confirmRefundAmountGbp - refundEstimate) > 0.01) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"confirm_refund_amount_gbp must match the preview refund estimate");
		}

		String cancellationType = str(preview.get("cancellation_type"));
		String refundStatus = refundEstimate > 0 ? "pending" : "not_applicable";
		String refundPaymentId = null;
		if (refundEstimate > 0) {
			refundPaymentId = paymentLedger.recordPolicyRefund(
					record.getQuoteId(),
					record.getPolicyId(),
					record.getCustomerEmail(),
					refundEstimate);
			if (refundPaymentId == null || refundPaymentId.isBlank()) {
				refundPaymentId = "REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
			}
		}

		String normalizedReason = normalizeReason(reason);
		PolicyRecord cancelled = policyRecords.cancelPolicy(
				policyId,
				normalizedReason,
				cancellationType,
				blankToNull(customerNote),
				refundStatus,
				refundEstimate,
				refundPaymentId);

		Map<String, Object> event = new LinkedHashMap<>();
		event.put("eventType", "PolicyCancelled");
		event.put("policyId", cancelled.getPolicyId());
		event.put("policyNumber", cancelled.getPolicyNumber());
		event.put("quoteId", cancelled.getQuoteId());
		event.put("customerId", cancelled.getCustomerId());
		event.put("customerEmail", cancelled.getCustomerEmail());
		event.put("productTitle", cancelled.getProductTitle());
		event.put("cancellationReason", normalizedReason);
		event.put("cancellationType", cancellationType);
		event.put("refundAmountGbp", refundEstimate);
		event.put("refundStatus", refundStatus);
		event.put("refundPaymentId", refundPaymentId);
		event.put("cancelledAt", cancelled.getCancelledAt().toString());
		publisher.publish(EventTopics.POLICY, event);

		if (StringUtils.hasText(cancelled.getCustomerEmail())) {
			mail.sendPolicyCancelled(
					cancelled.getCustomerEmail(),
					cancelled.getProductTitle(),
					cancelled.getPolicyNumber(),
					normalizedReason,
					refundEstimate,
					refundStatus);
		}

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("policy", policyRecords.toResponse(cancelled));
		response.put("refund_estimate_gbp", refundEstimate);
		response.put("refund_status", refundStatus);
		response.put("refund_payment_id", refundPaymentId);
		response.put("message", "Your policy has been cancelled.");
		return response;
	}

	private Map<String, Object> buildPreview(PolicyRecord record) {
		Map<String, Object> preview = new LinkedHashMap<>();
		preview.put("policy_id", record.getPolicyId());
		preview.put("policy_number", record.getPolicyNumber());
		preview.put("product_title", record.getProductTitle());
		preview.put("status", record.getStatus());
		preview.put("issued_at", record.getIssuedAt() == null ? null : record.getIssuedAt().toString());

		if (policyRecords.isCancelled(record)) {
			preview.put("eligible", false);
			preview.put("ineligible_reason", "This policy has already been cancelled.");
			preview.put("refund_estimate_gbp", 0.0);
			preview.put("cancellation_type", record.getCancellationType());
			return preview;
		}

		int openClaims = claimsClient.countOpenClaims(record.getPolicyId());
		if (openClaims > 0) {
			preview.put("eligible", false);
			preview.put("ineligible_reason",
					"This policy has " + openClaims + " open claim(s). Resolve them before cancelling.");
			preview.put("open_claims_count", openClaims);
			preview.put("refund_estimate_gbp", 0.0);
			return preview;
		}

		double premium = resolvePremium(record);
		String mintStatus = record.getMintStatus() == null ? "" : record.getMintStatus().toUpperCase(Locale.ROOT);
		boolean notMinted = "PENDING".equals(mintStatus)
				|| "PENDING_WALLET".equals(mintStatus)
				|| "FAILED".equals(mintStatus);
		boolean withinCoolingOff = isWithinCoolingOff(record.getIssuedAt());

		if (notMinted || withinCoolingOff) {
			preview.put("eligible", true);
			preview.put("cancellation_type", notMinted ? "customer" : "cooling_off");
			preview.put("refund_estimate_gbp", premium);
			preview.put("cooling_off", withinCoolingOff);
			preview.put("cooling_off_days_remaining", coolingOffDaysRemaining(record.getIssuedAt()));
			preview.put("refund_message", notMinted
					? "Full premium refund — policy was not yet active on-chain."
					: "Full premium refund — you are within the 14-day cooling-off period.");
			return preview;
		}

		preview.put("eligible", false);
		preview.put("ineligible_reason",
				"Cooling-off period has ended. Contact support if you need to discuss cancellation options.");
		preview.put("cancellation_type", "customer");
		preview.put("refund_estimate_gbp", 0.0);
		preview.put("cooling_off", false);
		return preview;
	}

	private PolicyRecord requireOwnedPolicy(String policyId, String customerId, String customerEmail) {
		PolicyRecord record = policyRecords.findByPolicyId(policyId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found"));
		if (!ownsPolicy(record, customerId, customerEmail)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this policy");
		}
		return record;
	}

	private static boolean ownsPolicy(PolicyRecord record, String customerId, String customerEmail) {
		if (StringUtils.hasText(customerId) && customerId.equals(record.getCustomerId())) {
			return true;
		}
		if (StringUtils.hasText(customerEmail)
				&& customerEmail.equalsIgnoreCase(record.getCustomerEmail())) {
			return true;
		}
		return false;
	}

	private double resolvePremium(PolicyRecord record) {
		if (!StringUtils.hasText(record.getQuoteId())) {
			return 0.0;
		}
		try {
			Map<String, Object> quote = quotes.getQuote(record.getQuoteId());
			Object premium = quote.get("estimated_premium");
			if (premium instanceof Number number) {
				return number.doubleValue();
			}
			return Double.parseDouble(String.valueOf(premium));
		}
		catch (Exception ex) {
			return 0.0;
		}
	}

	private static boolean isWithinCoolingOff(Instant issuedAt) {
		if (issuedAt == null) {
			return false;
		}
		return issuedAt.plus(COOLING_OFF_DAYS, ChronoUnit.DAYS).isAfter(Instant.now());
	}

	private static long coolingOffDaysRemaining(Instant issuedAt) {
		if (issuedAt == null) {
			return 0;
		}
		Instant end = issuedAt.plus(COOLING_OFF_DAYS, ChronoUnit.DAYS);
		long days = ChronoUnit.DAYS.between(Instant.now(), end);
		return Math.max(0, days);
	}

	private static String normalizeReason(String reason) {
		if (!StringUtils.hasText(reason)) {
			return "customer_request";
		}
		return reason.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
	}

	private static String blankToNull(String value) {
		return StringUtils.hasText(value) ? value.trim() : null;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static double num(Object value) {
		if (value instanceof Number number) {
			return number.doubleValue();
		}
		try {
			return Double.parseDouble(String.valueOf(value));
		}
		catch (Exception ex) {
			return 0.0;
		}
	}
}
