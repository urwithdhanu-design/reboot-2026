package com.gcul.policy.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.quote.QuoteService;

@RestController
@RequestMapping("/api")
public class QuoteController {

	private final QuoteService quotes;

	public QuoteController(QuoteService quotes) {
		this.quotes = quotes;
	}

	@GetMapping("/products/{productId}")
	public Map<String, Object> getProduct(@PathVariable String productId) {
		return quotes.getProduct(productId);
	}

	@GetMapping("/quotes")
	public Map<String, Object> listQuotes() {
		List<Map<String, Object>> items = quotes.listQuotes();
		return Map.of("quotes", items, "count", items.size());
	}

	@GetMapping("/quotes/schema")
	public Map<String, Object> schema(@RequestParam String category) {
		return quotes.schemaFor(category);
	}

	@PostMapping("/quotes/estimate")
	@SuppressWarnings("unchecked")
	public Map<String, Object> estimate(@RequestBody Map<String, Object> body) {
		Object productId = body.get("product_id");
		Object answers = body.get("answers");
		if (productId == null || String.valueOf(productId).isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "product_id is required");
		}
		if (!(answers instanceof Map<?, ?>)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "answers is required");
		}
		return quotes.estimate(String.valueOf(productId), (Map<String, Object>) answers);
	}

	@GetMapping("/quotes/{quoteId}")
	public Map<String, Object> getQuote(@PathVariable String quoteId) {
		return quotes.getQuote(quoteId);
	}
}
