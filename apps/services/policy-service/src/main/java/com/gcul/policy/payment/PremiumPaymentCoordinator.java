package com.gcul.policy.payment;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;
import com.gcul.policy.client.PaymentLedgerClient;
import com.gcul.policy.client.VendorReserveClient;
import com.gcul.policy.messaging.PolicyIssuanceService;
import com.gcul.policy.quote.QuoteService;
import com.gcul.policy.vendor.InsuranceVendor;
import com.gcul.policy.vendor.VendorQuoteResolver;

@Service
public class PremiumPaymentCoordinator {

	private static final Logger log = LoggerFactory.getLogger(PremiumPaymentCoordinator.class);

	private final QuoteService quotes;
	private final PaymentLedgerClient paymentLedger;
	private final PolicyIssuanceService issuance;
	private final GculEventPublisher eventPublisher;
	private final VendorQuoteResolver vendorQuoteResolver;
	private final VendorReserveClient vendorReserve;

	public PremiumPaymentCoordinator(
			QuoteService quotes,
			PaymentLedgerClient paymentLedger,
			PolicyIssuanceService issuance,
			GculEventPublisher eventPublisher,
			VendorQuoteResolver vendorQuoteResolver,
			VendorReserveClient vendorReserve) {
		this.quotes = quotes;
		this.paymentLedger = paymentLedger;
		this.issuance = issuance;
		this.eventPublisher = eventPublisher;
		this.vendorQuoteResolver = vendorQuoteResolver;
		this.vendorReserve = vendorReserve;
	}

	public void completePremiumPayment(Map<String, Object> payload, String provider) {
		String quoteId = firstNonBlank(str(payload.get("quoteId")), str(payload.get("quote_id")));
		if (quoteId.isBlank()) {
			log.warn("Premium payment missing quote id");
			return;
		}

		Map<String, Object> eventPayload = new LinkedHashMap<>(payload);
		eventPayload.putIfAbsent("eventType", "PremiumPaid");
		eventPayload.putIfAbsent("quoteId", quoteId);
		eventPayload.putIfAbsent("paymentStatus", "paid");
		eventPayload.putIfAbsent("paymentMethod", provider);

		if (!"wallet".equalsIgnoreCase(provider)) {
			creditVendorPremium(quoteId, eventPayload);
		}

		issuance.onPremiumPaid(eventPayload);
		recordInLedger(quoteId, eventPayload, provider);
		eventPublisher.publish(EventTopics.PAYMENT, eventPayload);
	}

	private void recordInLedger(String quoteId, Map<String, Object> payload, String provider) {
		try {
			Map<String, Object> quote = quotes.getQuote(quoteId);
			String policyRef = issuance.findPolicyByQuote(quoteId)
					.map(policy -> str(policy.get("policy_id")))
					.filter(ref -> !ref.isBlank())
					.orElse("POL-" + quoteId.replace("Q-", ""));

			Map<String, Object> ledger = new LinkedHashMap<>();
			ledger.put("quote_id", quoteId);
			ledger.put("policy_ref", policyRef);
			ledger.put("customer_email", extractEmail(quote, str(payload.get("customerEmail"))));
			ledger.put("amount", payload.getOrDefault("amount", quote.get("estimated_premium")));
			ledger.put("currency", String.valueOf(quote.getOrDefault("currency", payload.getOrDefault("currency", "gbp"))));
			ledger.put("provider", provider);
			paymentLedger.recordPremiumPaid(ledger);
		}
		catch (Exception ex) {
			Map<String, Object> fallback = new LinkedHashMap<>();
			fallback.put("quote_id", quoteId);
			fallback.put("policy_ref", "POL-" + quoteId.replace("Q-", ""));
			fallback.put("customer_email", str(payload.get("customerEmail")));
			fallback.put("amount", payload.get("amount"));
			fallback.put("currency", payload.getOrDefault("currency", "gbp"));
			fallback.put("provider", provider);
			paymentLedger.recordPremiumPaid(fallback);
		}
	}

	private void creditVendorPremium(String quoteId, Map<String, Object> payload) {
		try {
			Map<String, Object> quote = quotes.getQuote(quoteId);
			Optional<InsuranceVendor> vendor = vendorQuoteResolver.resolveForQuote(quote);
			if (vendor.isEmpty()) {
				log.warn("No vendor mapped for quote {} — premium not credited to vendor reserve", quoteId);
				return;
			}
			double amount = num(payload.get("amount"), num(quote.get("estimated_premium"), 0));
			if (amount <= 0) {
				log.warn("Skipping vendor premium credit for quote {} — invalid amount", quoteId);
				return;
			}
			String customerId = firstNonBlank(str(payload.get("customerId")), str(payload.get("customer_id")));
			InsuranceVendor v = vendor.get();
			vendorReserve.creditPremium(v.getCode(), v.getName(), amount, quoteId, customerId);
		}
		catch (Exception ex) {
			log.error("Failed to credit vendor premium for quote {}: {}", quoteId, ex.getMessage());
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Vendor premium credit failed: " + ex.getMessage());
		}
	}

	private static double num(Object raw, double fallback) {
		if (raw instanceof Number number) {
			return number.doubleValue();
		}
		if (raw == null) {
			return fallback;
		}
		try {
			return Double.parseDouble(String.valueOf(raw));
		}
		catch (NumberFormatException ex) {
			return fallback;
		}
	}

	private static String extractEmail(Map<String, Object> quote, String fallbackEmail) {
		Object answersObj = quote.get("answers");
		if (answersObj instanceof Map<?, ?> answers) {
			Object raw = answers.get("email");
			if (raw != null && !String.valueOf(raw).isBlank()) {
				return String.valueOf(raw).trim();
			}
		}
		return fallbackEmail == null ? "" : fallbackEmail.trim();
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value;
			}
		}
		return "";
	}
}
