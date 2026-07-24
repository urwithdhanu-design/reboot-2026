package com.gcul.payment.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.payment.cache.AdminViewCache;
import com.gcul.payment.cache.FirestoreCacheProperties;
import com.gcul.payment.service.PaymentLedgerService;

@RestController
@RequestMapping("/api/payment-ledger")
public class PaymentController {

	private final PaymentLedgerService payments;
	private final AdminViewCache adminCache;
	private final FirestoreCacheProperties firestoreProps;

	public PaymentController(
			PaymentLedgerService payments,
			AdminViewCache adminCache,
			FirestoreCacheProperties firestoreProps) {
		this.payments = payments;
		this.adminCache = adminCache;
		this.firestoreProps = firestoreProps;
	}

	@GetMapping
	public Map<String, Object> list(@RequestParam(required = false) String quote_id) {
		List<Map<String, Object>> items = payments.list(quote_id);
		return Map.of("payments", items, "count", items.size());
	}

	@PostMapping("/refresh-cache")
	public Map<String, Object> refreshCache() {
		payments.list(null);
		return Map.of(
				"ok", true,
				"firestore_active", adminCache.isActive(),
				"project_id", firestoreProps.getProjectId(),
				"collection", firestoreProps.getCollection(),
				"document", AdminViewCache.DOC_PAYMENTS);
	}

	@PostMapping
	public Map<String, Object> create(@RequestBody Map<String, Object> body) {
		return payments.create(body);
	}

	@GetMapping("/{id}")
	public Map<String, Object> get(@PathVariable String id) {
		return payments.get(id);
	}

	@PostMapping("/{id}/confirm")
	public Map<String, Object> confirm(@PathVariable String id) {
		return payments.confirm(id);
	}

	/** Service identity — Stripe checkout remains on policy-service /api/payments for now. */
	@GetMapping("/info")
	public Map<String, Object> info() {
		return Map.of(
				"service", "payment-service",
				"role", "payment ledger and settlement records",
				"stripe_checkout", "policy-service:/api/payments");
	}
}
