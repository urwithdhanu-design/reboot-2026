package com.gcul.policy.admin;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.gcul.policy.quote.QuoteService;

@Service
public class AdminPolicyService {

	private final QuoteService quoteService;

	public AdminPolicyService(QuoteService quoteService) {
		this.quoteService = quoteService;
	}

	public Map<String, Object> listPolicies() {
		List<Map<String, Object>> policies = new ArrayList<>();
		for (Map<String, Object> quote : quoteService.listQuotes()) {
			policies.add(toPolicyRow(quote));
		}
		return Map.of("policies", policies, "count", policies.size());
	}

	public Map<String, Object> stats() {
		int quoteCount = quoteService.listQuotes().size();
		return Map.of(
				"total_quotes", quoteCount,
				"total_applications", quoteCount);
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> toPolicyRow(Map<String, Object> quote) {
		Map<String, Object> answers = quote.get("answers") instanceof Map<?, ?> m
				? (Map<String, Object>) m
				: Map.of();

		String email = firstNonBlank(
				str(answers.get("email")),
				"");
		String customerName = firstNonBlank(
				joinName(str(answers.get("first_name")), str(answers.get("last_name"))),
				str(answers.get("full_name")),
				email.isBlank() ? "Customer" : email);

		Map<String, Object> row = new LinkedHashMap<>();
		row.put("id", quote.get("quote_id"));
		row.put("quote_id", quote.get("quote_id"));
		row.put("policy_number", "POL-" + String.valueOf(quote.get("quote_id")).replace("Q-", ""));
		row.put("product_id", quote.get("product_id"));
		row.put("product_title", quote.get("product_title"));
		row.put("category", quote.get("category"));
		row.put("premium", quote.get("estimated_premium"));
		row.put("price_unit", quote.get("price_unit"));
		row.put("currency", quote.get("currency"));
		row.put("customer_name", customerName);
		row.put("customer_email", email);
		row.put("status", "quoted");
		row.put("created_at", quote.getOrDefault("created_at", ""));
		return row;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static String joinName(String first, String last) {
		String joined = (first + " " + last).trim();
		return joined.isBlank() ? "" : joined;
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
