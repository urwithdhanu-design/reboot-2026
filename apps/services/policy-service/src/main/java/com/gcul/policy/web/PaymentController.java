package com.gcul.policy.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.payment.StripePaymentService;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

	private final StripePaymentService payments;

	public PaymentController(StripePaymentService payments) {
		this.payments = payments;
	}

	@GetMapping("/config")
	public Map<String, Object> config() {
		return payments.publicConfig();
	}

	@PostMapping("/checkout")
	public Map<String, Object> checkout(@RequestBody CheckoutRequest body) {
		if (body == null || body.quoteId() == null || body.quoteId().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quote_id is required");
		}
		return payments.createCheckoutSession(body.quoteId().trim());
	}

	@GetMapping("/session/{sessionId}")
	public Map<String, Object> session(@PathVariable String sessionId) {
		return payments.getSessionStatus(sessionId);
	}

	public record CheckoutRequest(@NotBlank String quote_id) {
		public String quoteId() {
			return quote_id;
		}
	}
}
