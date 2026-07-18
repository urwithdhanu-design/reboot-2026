package com.gcul.policy.payment;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
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

	private final StripeProperties properties;
	private final QuoteService quotes;
	private final MailService mail;
	private final Set<String> paymentEmailsSent = ConcurrentHashMap.newKeySet();

	public StripePaymentService(StripeProperties properties, QuoteService quotes, MailService mail) {
		this.properties = properties;
		this.quotes = quotes;
		this.mail = mail;
	}

	@PostConstruct
	void init() {
		if (properties.isConfigured()) {
			Stripe.apiKey = properties.getSecretKey().trim();
		}
	}

	public Map<String, Object> publicConfig() {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("configured", properties.isConfigured());
		map.put("publishable_key", properties.getPublishableKey() == null ? "" : properties.getPublishableKey());
		map.put("currency", properties.getCurrency());
		return map;
	}

	public Map<String, Object> createCheckoutSession(String quoteId) {
		ensureConfigured();
		Map<String, Object> quote = quotes.getQuote(quoteId);

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
			return response;
		}
		catch (StripeException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Stripe checkout failed: " + ex.getMessage());
		}
	}

	public Map<String, Object> getSessionStatus(String sessionId) {
		ensureConfigured();
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

			if (paid && paymentEmailsSent.add(sessionId)) {
				notifyPaymentEmail(session, amountTotal);
			}
			return map;
		}
		catch (StripeException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Could not retrieve Stripe session: " + ex.getMessage());
		}
	}

	@SuppressWarnings("unchecked")
	private void notifyPaymentEmail(Session session, double amountTotal) {
		String quoteId = session.getClientReferenceId();
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
			String currency = session.getCurrency() == null
					? String.valueOf(quote.getOrDefault("currency", "gbp"))
					: session.getCurrency();
			mail.sendPaymentReceived(email, productTitle, quoteId, amountTotal, currency);
		}
		catch (Exception ignored) {
			// Quote may have expired from in-memory store; don't fail payment status
		}
	}

	private void ensureConfigured() {
		if (!properties.isConfigured()) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Stripe is not configured. Set STRIPE_SECRET_KEY on policy-service.");
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
}
