package com.gcul.policy.messaging;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;
import com.gcul.policy.quote.QuoteService;

@Service
public class PolicyIssuanceService {

	private static final Logger log = LoggerFactory.getLogger(PolicyIssuanceService.class);

	private final QuoteService quotes;
	private final GculEventPublisher publisher;
	private final ConcurrentHashMap<String, Map<String, Object>> policies = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, String> quoteToPolicy = new ConcurrentHashMap<>();

	public PolicyIssuanceService(QuoteService quotes, GculEventPublisher publisher) {
		this.quotes = quotes;
		this.publisher = publisher;
	}

	public void onPremiumPaid(Map<String, Object> payload) {
		String quoteId = firstNonBlank(str(payload.get("quoteId")), str(payload.get("quote_id")));
		if (quoteId.isBlank()) {
			log.warn("PremiumPaid missing quoteId");
			return;
		}
		if (quoteToPolicy.containsKey(quoteId)) {
			log.debug("Policy already issued for quote {}", quoteId);
			return;
		}
		Map<String, Object> quote;
		try {
			quote = quotes.getQuote(quoteId);
		}
		catch (Exception ex) {
			log.warn("Quote {} not found for PremiumPaid: {}", quoteId, ex.getMessage());
			return;
		}

		String policyId = "POL-" + quoteId.replace("Q-", "");
		String policyNumber = policyId;
		String customerId = extractCustomerId(quote);

		Map<String, Object> policy = new LinkedHashMap<>();
		policy.put("policy_id", policyId);
		policy.put("policy_number", policyNumber);
		policy.put("quote_id", quoteId);
		policy.put("customer_id", customerId);
		policy.put("product_title", quote.get("product_title"));
		policy.put("status", "issued");
		policy.put("issued_at", Instant.now().toString());
		policies.put(policyId, policy);
		quoteToPolicy.put(quoteId, policyId);

		Map<String, Object> created = new LinkedHashMap<>();
		created.put("eventType", "PolicyCreated");
		created.put("policyId", policyId);
		created.put("policyNumber", policyNumber);
		created.put("quoteId", quoteId);
		created.put("customerId", customerId);
		created.put("productTitle", quote.get("product_title"));
		created.put("status", "ISSUED");
		publisher.publish(EventTopics.POLICY, created);

		Map<String, Object> mintRequest = new LinkedHashMap<>();
		mintRequest.put("eventType", "PolicyMintRequested");
		mintRequest.put("policyId", policyId);
		mintRequest.put("policyNumber", policyNumber);
		mintRequest.put("customerId", customerId);
		mintRequest.put("walletAddress", payload.get("walletAddress"));
		publisher.publish(EventTopics.POLICY, mintRequest);

		log.info("Issued policy {} for quote {}", policyId, quoteId);
	}

	public void onPolicyMinted(Map<String, Object> payload) {
		String policyId = str(payload.get("policyId"));
		if (policyId.isBlank()) {
			return;
		}
		Map<String, Object> policy = policies.get(policyId);
		if (policy == null) {
			policy = new LinkedHashMap<>();
			policy.put("policy_id", policyId);
			policies.put(policyId, policy);
		}
		policy.put("token_id", payload.get("tokenId"));
		policy.put("tx_hash", payload.get("transactionHash"));
		policy.put("status", "active");
		policy.put("activated_at", Instant.now().toString());

		Map<String, Object> activated = new LinkedHashMap<>();
		activated.put("eventType", "PolicyActivated");
		activated.put("policyId", policyId);
		activated.put("tokenId", payload.get("tokenId"));
		activated.put("status", "ACTIVE");
		publisher.publish(EventTopics.POLICY, activated);
	}

	public void onWalletLinked(Map<String, Object> payload) {
		log.info("Wallet linked for customer {} — ready for policy mint", payload.get("customerId"));
	}

	public Map<String, Object> getPolicy(String policyId) {
		return policies.get(policyId);
	}

	private static String extractCustomerId(Map<String, Object> quote) {
		Object answersObj = quote.get("answers");
		if (answersObj instanceof Map<?, ?> answers) {
			Object email = answers.get("email");
			if (email != null && !String.valueOf(email).isBlank()) {
				return String.valueOf(email).trim().toLowerCase();
			}
		}
		return "unknown";
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
