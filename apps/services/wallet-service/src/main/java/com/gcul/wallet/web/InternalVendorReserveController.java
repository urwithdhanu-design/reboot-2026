package com.gcul.wallet.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.wallet.service.VendorReserveService;

@RestController
@RequestMapping("/api/internal/vendor-reserve")
public class InternalVendorReserveController {

	private final VendorReserveService vendorReserve;

	public InternalVendorReserveController(VendorReserveService vendorReserve) {
		this.vendorReserve = vendorReserve;
	}

	@GetMapping("/{vendorCode}")
	public Map<String, Object> view(
			@PathVariable String vendorCode,
			@RequestParam(defaultValue = "") String vendorName) {
		return vendorReserve.view(vendorCode, vendorName);
	}

	@PostMapping("/{vendorCode}/contribute")
	public Map<String, Object> contribute(
			@PathVariable String vendorCode,
			@RequestParam(defaultValue = "") String vendorName,
			@RequestBody Map<String, Object> body) {
		double amount = parseAmount(body.get("amount"));
		String reference = body.get("reference") == null ? null : String.valueOf(body.get("reference"));
		return vendorReserve.contribute(vendorCode, vendorName, amount, reference);
	}

	@PostMapping("/{vendorCode}/credit-premium")
	public Map<String, Object> creditPremium(
			@PathVariable String vendorCode,
			@RequestParam(defaultValue = "") String vendorName,
			@RequestBody Map<String, Object> body) {
		double amount = parseAmount(body.get("amount"));
		String quoteId = body.get("quote_id") == null ? null : String.valueOf(body.get("quote_id"));
		String customerId = body.get("customer_id") == null ? null : String.valueOf(body.get("customer_id"));
		return vendorReserve.creditPremium(vendorCode, vendorName, amount, quoteId, customerId);
	}

	private static double parseAmount(Object raw) {
		if (raw instanceof Number number) {
			return number.doubleValue();
		}
		if (raw == null) {
			return 0;
		}
		return Double.parseDouble(String.valueOf(raw));
	}
}
