package com.gcul.policy.payment;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.client.WalletClient;
import com.gcul.policy.mail.MailService;
import com.gcul.policy.messaging.PolicyIssuanceService;
import com.gcul.policy.quote.QuoteService;

@Service
public class WalletPaymentService {

	private final QuoteService quotes;
	private final WalletClient walletClient;
	private final PolicyIssuanceService issuance;
	private final MailService mail;
	private final PremiumPaymentCoordinator premiumPayments;

	public WalletPaymentService(
			QuoteService quotes,
			WalletClient walletClient,
			PolicyIssuanceService issuance,
			MailService mail,
			PremiumPaymentCoordinator premiumPayments) {
		this.quotes = quotes;
		this.walletClient = walletClient;
		this.issuance = issuance;
		this.mail = mail;
		this.premiumPayments = premiumPayments;
	}

	public Map<String, Object> payWithWallet(String userId, String userEmail, String quoteId, String bearerToken) {
		Map<String, Object> quote = quotes.getQuote(quoteId);
		double amount = extractPremium(quote);
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quote premium");
		}

		Map<String, Object> walletResult = walletClient.payPremium(bearerToken, quoteId, amount);
		String walletAddress = String.valueOf(walletResult.getOrDefault("address", ""));

		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("eventType", "PremiumPaid");
		payload.put("quoteId", quoteId);
		payload.put("amount", amount);
		payload.put("currency", String.valueOf(quote.getOrDefault("currency", "gbp")));
		payload.put("paymentStatus", "paid");
		payload.put("customerId", userId);
		payload.put("customerEmail", userEmail);
		payload.put("walletAddress", walletAddress.isBlank() ? null : walletAddress);
		payload.put("paymentMethod", "wallet");
		Object tx = walletResult.get("transaction");
		if (tx instanceof Map<?, ?> txMap) {
			payload.put("walletTransactionId", txMap.get("id"));
		}

		premiumPayments.completePremiumPayment(payload, "wallet");

		String email = extractEmail(quote, userEmail);
		if (!email.isBlank()) {
			String productTitle = String.valueOf(quote.getOrDefault("product_title", "Insurance"));
			String currency = String.valueOf(quote.getOrDefault("currency", "gbp"));
			mail.sendPaymentReceived(email, productTitle, quoteId, amount, currency);
		}

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("paid", true);
		response.put("quote_id", quoteId);
		response.put("amount", amount);
		response.put("currency", quote.getOrDefault("currency", "gbp"));
		response.put("wallet_address", walletAddress);
		response.put("balance_gbp", walletResult.get("balance_gbp"));
		response.put("payment_method", "wallet");

		issuance.findPolicyByQuote(quoteId).ifPresent(policy -> response.put("policy_id", policy.get("policy_id")));
		return response;
	}

	private static double extractPremium(Map<String, Object> quote) {
		Object premium = quote.get("estimated_premium");
		if (premium instanceof Number number) {
			return Math.round(number.doubleValue() * 100.0) / 100.0;
		}
		try {
			return Math.round(Double.parseDouble(String.valueOf(premium)) * 100.0) / 100.0;
		}
		catch (Exception ex) {
			return 0;
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
}
