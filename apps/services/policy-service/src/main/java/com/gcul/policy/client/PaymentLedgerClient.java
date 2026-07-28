package com.gcul.policy.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class PaymentLedgerClient {

	private static final Logger log = LoggerFactory.getLogger(PaymentLedgerClient.class);

	private final RestClient restClient;

	public PaymentLedgerClient(@Value("${gcul.payment-service.url:http://127.0.0.1:8083}") String baseUrl) {
		this.restClient = RestClient.builder().baseUrl(baseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public void recordPremiumPaid(Map<String, Object> body) {
		try {
			restClient.post()
					.uri("/api/payment-ledger/premium-paid")
					.body(body)
					.retrieve()
					.body(Map.class);
		}
		catch (Exception ex) {
			log.warn("Could not record premium payment in ledger for quote {}: {}",
					body.get("quote_id"), ex.getMessage());
		}
	}

	@SuppressWarnings("unchecked")
	public String recordPolicyRefund(
			String quoteId,
			String policyRef,
			String customerEmail,
			double amountGbp) {
		try {
			Map<String, Object> body = Map.of(
					"quote_id", quoteId,
					"policy_ref", policyRef,
					"customer_email", customerEmail == null ? "" : customerEmail,
					"amount", amountGbp,
					"currency", "GBP",
					"provider", "refund",
					"status", "refund_pending");
			Map<String, Object> response = restClient.post()
					.uri("/api/payment-ledger")
					.body(body)
					.retrieve()
					.body(Map.class);
			if (response != null && response.get("id") != null) {
				return String.valueOf(response.get("id"));
			}
		}
		catch (Exception ex) {
			log.warn("Could not record refund in ledger for policy {}: {}", policyRef, ex.getMessage());
		}
		return null;
	}
}
