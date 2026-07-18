package com.gcul.payment.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.payment.model.PaymentRecord;
import com.gcul.payment.repository.PaymentRecordRepository;

@Service
public class PaymentLedgerService {

	private final PaymentRecordRepository repo;

	public PaymentLedgerService(PaymentRecordRepository repo) {
		this.repo = repo;
	}

	public Map<String, Object> create(Map<String, Object> body) {
		String quoteId = str(body.get("quote_id"));
		if (quoteId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quote_id is required");
		}
		PaymentRecord record = new PaymentRecord();
		record.setId("PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		record.setQuoteId(quoteId);
		record.setPolicyRef(str(body.get("policy_ref")));
		record.setCustomerEmail(str(body.get("customer_email")));
		record.setAmount(num(body.get("amount"), 0));
		record.setCurrency(firstNonBlank(str(body.get("currency")), "GBP"));
		record.setStatus("pending");
		record.setProvider(firstNonBlank(str(body.get("provider")), "stripe"));
		record.setCreatedAt(Instant.now());
		record.setUpdatedAt(Instant.now());
		return toMap(repo.save(record));
	}

	public List<Map<String, Object>> list(String quoteId) {
		List<PaymentRecord> rows = quoteId == null || quoteId.isBlank()
				? repo.findAllByOrderByCreatedAtDesc()
				: repo.findByQuoteIdOrderByCreatedAtDesc(quoteId);
		return rows.stream().map(this::toMap).toList();
	}

	public Map<String, Object> get(String id) {
		return toMap(repo.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found")));
	}

	public Map<String, Object> confirm(String id) {
		PaymentRecord record = repo.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
		record.setStatus("paid");
		record.setUpdatedAt(Instant.now());
		return toMap(repo.save(record));
	}

	private Map<String, Object> toMap(PaymentRecord r) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", r.getId());
		map.put("quote_id", r.getQuoteId());
		map.put("policy_ref", r.getPolicyRef());
		map.put("customer_email", r.getCustomerEmail());
		map.put("amount", r.getAmount());
		map.put("currency", r.getCurrency());
		map.put("status", r.getStatus());
		map.put("provider", r.getProvider());
		map.put("created_at", r.getCreatedAt().toString());
		map.put("updated_at", r.getUpdatedAt() == null ? null : r.getUpdatedAt().toString());
		return map;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static double num(Object value, double fallback) {
		try {
			return Double.parseDouble(String.valueOf(value));
		} catch (Exception ex) {
			return fallback;
		}
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) return value;
		}
		return "";
	}
}
