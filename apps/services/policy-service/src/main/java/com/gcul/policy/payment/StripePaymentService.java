package com.gcul.policy.payment;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.config.StripeProperties;
import com.gcul.policy.mail.MailService;
import com.gcul.policy.quote.QuoteService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import jakarta.annotation.PostConstruct;

@Service
public class StripePaymentService {

	private static final String DEMO_SESSION_PREFIX = "demo_cs_";

	private final StripeProperties properties;
	private final QuoteService quotes;
	private final MailService mail;
	private final PremiumPaymentCoordinator premiumPayments;
	private final Set<String> paymentEmailsSent = ConcurrentHashMap.newKeySet();
	private final Set<String> premiumPaidPublished = ConcurrentHashMap.newKeySet();
	private final Map<String, DemoCheckoutSession> demoSessions = new ConcurrentHashMap<>();

	public StripePaymentService(
			StripeProperties properties,
			QuoteService quotes,
			MailService mail,
			PremiumPaymentCoordinator premiumPayments) {
		this.properties = properties;
		this.quotes = quotes;
		this.mail = mail;
		this.premiumPayments = premiumPayments;
	}

	@PostConstruct
	void init() {
		if (properties.isConfigured()) {
			Stripe.apiKey = properties.getSecretKey().trim();
		}
	}

	public Map<String, Object> publicConfig() {
		Map<String, Object> map = new LinkedHashMap<>();
		boolean demo = properties.useDemoPayments();
		map.put("configured", properties.isConfigured());
		map.put("demo_mode", demo);
		map.put("mode", demo ? "demo" : (properties.isConfigured() ? "stripe" : "disabled"));
		map.put("publishable_key", properties.getPublishableKey() == null ? "" : properties.getPublishableKey());
		map.put("currency", properties.getCurrency());
		return map;
	}

	public Map<String, Object> createCheckoutSession(String quoteId) {
		Map<String, Object> quote = quotes.getQuote(quoteId);
		if (properties.useDemoPayments()) {
			return createDemoCheckoutSession(quoteId, quote);
		}
		ensureStripeConfigured();

		long amountPence = toMinorUnits(quote.get("estimated_premium"));
		if (amountPence < 30) {
			amountPence = 30;
		}

		String productTitle = String.valueOf(quote.getOrDefault("product_title", "Insurance premium"));
		String currency = String.valueOf(quote.getOrDefault("currency", properties.getCurrency()))
				.toLowerCase();
		String priceUnit = String.valueOf(quote.getOrDefault("price_unit", "month"));

		try {
			SessionCreateParams params = SessionCreateParams.builder()
					.setMode(SessionCreateParams.Mode.PAYMENT)
					.setSuccessUrl(properties.getSuccessUrl() + "?session_id={CHECKOUT_SESSION_ID}")
					.setCancelUrl(properties.getCancelUrl() + "?quote_id=" + quoteId)
					.setClientReferenceId(quoteId)
					.putMetadata("quote_id", quoteId)
					.putMetadata("product_title", productTitle)
					.addLineItem(SessionCreateParams.LineItem.builder()
							.setQuantity(1L)
							.setPriceData(SessionCreateParams.LineItem.PriceData.builder()
									.setCurrency(currency)
									.setUnitAmount(amountPence)
									.setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
											.setName(productTitle)
											.setDescription("First " + priceUnit + " premium · Quote " + quoteId)
											.build())
									.build())
							.build())
					.build();

			Session session = Session.create(params);

			Map<String, Object> response = new LinkedHashMap<>();
			response.put("session_id", session.getId());
			response.put("url", session.getUrl());
			response.put("quote_id", quoteId);
			response.put("amount", amountPence / 100.0);
			response.put("currency", currency);
			response.put("mode", "stripe");
			return response;
		}
		catch (StripeException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Stripe checkout failed: " + ex.getMessage());
		}
	}

	public Map<String, Object> getSessionStatus(String sessionId) {
		if (isDemoSession(sessionId)) {
			return getDemoSessionStatus(sessionId);
		}
		ensureStripeConfigured();
		try {
			Session session = Session.retrieve(sessionId);
			boolean paid = "paid".equalsIgnoreCase(session.getPaymentStatus());
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("session_id", session.getId());
			map.put("status", session.getStatus());
			map.put("payment_status", session.getPaymentStatus());
			map.put("quote_id", session.getClientReferenceId());
			if (session.getMetadata() != null) {
				map.put("metadata", new HashMap<>(session.getMetadata()));
			}
			double amountTotal = session.getAmountTotal() == null ? 0 : session.getAmountTotal() / 100.0;
			map.put("amount_total", amountTotal);
			map.put("currency", session.getCurrency());
			map.put("paid", paid);
			map.put("mode", "stripe");

			if (paid && paymentEmailsSent.add(sessionId)) {
				notifyPaymentEmail(session.getClientReferenceId(), amountTotal, session.getCurrency(), sessionId);
			}
			if (paid && premiumPaidPublished.add(sessionId)) {
				publishPremiumPaid(session.getClientReferenceId(), amountTotal, session.getCurrency(), sessionId);
			}
			return map;
		}
		catch (StripeException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Could not retrieve Stripe session: " + ex.getMessage());
		}
	}

	private Map<String, Object> createDemoCheckoutSession(String quoteId, Map<String, Object> quote) {
		long amountPence = toMinorUnits(quote.get("estimated_premium"));
		if (amountPence < 30) {
			amountPence = 30;
		}
		String currency = String.valueOf(quote.getOrDefault("currency", properties.getCurrency())).toLowerCase();
		String sessionId = DEMO_SESSION_PREFIX + UUID.randomUUID().toString().replace("-", "");
		demoSessions.put(sessionId, new DemoCheckoutSession(quoteId, amountPence / 100.0, currency));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("session_id", sessionId);
		response.put("url", properties.getSuccessUrl() + "?session_id=" + sessionId);
		response.put("quote_id", quoteId);
		response.put("amount", amountPence / 100.0);
		response.put("currency", currency);
		response.put("mode", "demo");
		return response;
	}

	private Map<String, Object> getDemoSessionStatus(String sessionId) {
		DemoCheckoutSession session = demoSessions.get(sessionId);
		if (session == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Demo payment session not found");
		}

		Map<String, Object> map = new LinkedHashMap<>();
		map.put("session_id", sessionId);
		map.put("status", "complete");
		map.put("payment_status", "paid");
		map.put("quote_id", session.quoteId());
		map.put("amount_total", session.amount());
		map.put("currency", session.currency());
		map.put("paid", true);
		map.put("mode", "demo");

		if (paymentEmailsSent.add(sessionId)) {
			notifyPaymentEmail(session.quoteId(), session.amount(), session.currency(), sessionId);
		}
		if (premiumPaidPublished.add(sessionId)) {
			publishPremiumPaid(session.quoteId(), session.amount(), session.currency(), sessionId);
		}
		return map;
	}

	@SuppressWarnings("unchecked")
	private void notifyPaymentEmail(String quoteId, double amountTotal, String currency, String sessionId) {
		if (quoteId == null || quoteId.isBlank()) {
			return;
		}
		try {
			Map<String, Object> quote = quotes.getQuote(quoteId);
			Object answersObj = quote.get("answers");
			String email = "";
			if (answersObj instanceof Map<?, ?> answers) {
				Object raw = answers.get("email");
				email = raw == null ? "" : String.valueOf(raw).trim();
			}
			if (email.isBlank()) {
				return;
			}
			String productTitle = String.valueOf(quote.getOrDefault("product_title", "Insurance"));
			String resolvedCurrency = currency == null || currency.isBlank()
					? String.valueOf(quote.getOrDefault("currency", "gbp"))
					: currency;
			mail.sendPaymentReceived(email, productTitle, quoteId, amountTotal, resolvedCurrency);
		}
		catch (Exception ignored) {
			// Quote may have expired from in-memory store; don't fail payment status
		}
	}

	private void publishPremiumPaid(String quoteId, double amountTotal, String currency, String sessionId) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("eventType", "PremiumPaid");
		payload.put("quoteId", quoteId);
		payload.put("stripeSessionId", sessionId);
		payload.put("amount", amountTotal);
		payload.put("currency", currency);
		payload.put("paymentStatus", "paid");
		payload.put("mode", isDemoSession(sessionId) ? "demo" : "stripe");
		payload.put("paymentMethod", isDemoSession(sessionId) ? "demo" : "stripe");
		try {
			Map<String, Object> quote = quotes.getQuote(quoteId);
			String email = extractEmailFromQuote(quote);
			if (!email.isBlank()) {
				payload.put("customerEmail", email);
				payload.put("customerId", email);
			}
		}
		catch (Exception ignored) {
			// quote may have expired; issuance will still attempt lookup
		}
		String provider = isDemoSession(sessionId) ? "demo" : "stripe";
		premiumPayments.completePremiumPayment(payload, provider);
	}

	private static String extractEmailFromQuote(Map<String, Object> quote) {
		Object answersObj = quote.get("answers");
		if (answersObj instanceof Map<?, ?> answers) {
			Object raw = answers.get("email");
			if (raw != null && !String.valueOf(raw).isBlank()) {
				return String.valueOf(raw).trim();
			}
		}
		return "";
	}

	private static boolean isDemoSession(String sessionId) {
		return sessionId != null && sessionId.startsWith(DEMO_SESSION_PREFIX);
	}

	private void ensureStripeConfigured() {
		if (!properties.isConfigured()) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Stripe is not configured. Set STRIPE_SECRET_KEY on policy-service "
							+ "or enable STRIPE_DEMO_MODE=true for local testing.");
		}
		Stripe.apiKey = properties.getSecretKey().trim();
	}

	private static long toMinorUnits(Object premium) {
		if (premium == null) {
			return 0;
		}
		double value;
		if (premium instanceof Number number) {
			value = number.doubleValue();
		}
		else {
			value = Double.parseDouble(String.valueOf(premium));
		}
		return Math.round(value * 100.0);
	}

	private record DemoCheckoutSession(String quoteId, double amount, String currency) {
	}
}
