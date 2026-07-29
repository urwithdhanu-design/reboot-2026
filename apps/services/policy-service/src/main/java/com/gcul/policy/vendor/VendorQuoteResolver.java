package com.gcul.policy.vendor;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

@Service
public class VendorQuoteResolver {

	private static final Map<String, String> PRODUCT_VENDOR_CODES = Map.of(
			"health-plan", "vitality",
			"home-insurance", "homeshield");

	private final InsuranceVendorRepository vendors;

	public VendorQuoteResolver(InsuranceVendorRepository vendors) {
		this.vendors = vendors;
	}

	public Optional<InsuranceVendor> resolveForQuote(Map<String, Object> quote) {
		if (quote == null || quote.isEmpty()) {
			return Optional.empty();
		}
		String productId = str(quote.get("product_id")).toLowerCase(Locale.ROOT);
		if (PRODUCT_VENDOR_CODES.containsKey(productId)) {
			return vendors.findByCodeIgnoreCase(PRODUCT_VENDOR_CODES.get(productId));
		}
		String category = str(quote.get("category")).toLowerCase(Locale.ROOT);
		String title = str(quote.get("product_title")).toLowerCase(Locale.ROOT);
		return vendors.findAll().stream()
				.filter(vendor -> matchesQuote(vendor, category, title))
				.findFirst();
	}

	private static boolean matchesQuote(InsuranceVendor vendor, String category, String title) {
		String cats = vendor.getCategories() == null ? "" : vendor.getCategories().toLowerCase(Locale.ROOT);
		String code = vendor.getCode() == null ? "" : vendor.getCode().toLowerCase(Locale.ROOT);
		if (!category.isBlank()) {
			if (cats.contains(category) || category.contains(cats)) {
				return true;
			}
			if ("property".equals(category) && cats.contains("home")) {
				return true;
			}
		}
		if (!code.isBlank() && title.contains(code)) {
			return true;
		}
		return "vitality".equals(code) && title.contains("health");
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
