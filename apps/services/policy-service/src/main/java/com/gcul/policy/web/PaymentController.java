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
import com.gcul.policy.payment.WalletPaymentService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

	private final StripePaymentService payments;
	private final WalletPaymentService walletPayments;

	public PaymentController(StripePaymentService payments, WalletPaymentService walletPayments) {
		this.payments = payments;
		this.walletPayments = walletPayments;
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

	@PostMapping("/wallet")
	public Map<String, Object> payWithWallet(
			HttpServletRequest request,
			@RequestBody CheckoutRequest body) {
		if (body == null || body.quoteId() == null || body.quoteId().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quote_id is required");
		}
		return walletPayments.payWithWallet(
				requireUserId(request),
				(String) request.getAttribute("userEmail"),
				body.quoteId().trim(),
				requireBearer(request));
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

	private static String requireUserId(HttpServletRequest request) {
		Object userId = request.getAttribute("userId");
		if (userId instanceof String id && !id.isBlank()) {
			return id;
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
	}

	private static String requireBearer(HttpServletRequest request) {
		String header = request.getHeader("Authorization");
		if (header != null && header.startsWith("Bearer ")) {
			return header.substring(7);
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
	}
}
