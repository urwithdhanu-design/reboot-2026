package com.gcul.claims.service;

import java.util.Locale;

final class PolicyCategoryNormalizer {

	private PolicyCategoryNormalizer() {
	}

	static String normalize(String category, String productTitle) {
		String raw = firstNonBlank(category, productTitle, "General");
		String key = raw.trim().toLowerCase(Locale.ROOT);
		if (key.equals("home")) {
			return "Property";
		}
		if (key.equals("life") || key.equals("travel") || key.equals("health")
				|| key.equals("property") || key.equals("vehicle") || key.equals("pet")) {
			return key.substring(0, 1).toUpperCase(Locale.ROOT) + key.substring(1);
		}
		if (key.contains("travel") || key.contains("flight") || key.contains("trip") || key.contains("protect plus")) {
			return "Travel";
		}
		if (key.contains("home") || key.contains("property") || key.contains("buildings")
				|| key.contains("contents")) {
			return "Property";
		}
		if (key.contains("motor") || key.contains("vehicle") || key.contains("car insurance")) {
			return "Vehicle";
		}
		if (key.contains("health") || key.contains("vitality")) {
			return "Health";
		}
		if (key.contains("pet")) {
			return "Pet";
		}
		if (key.contains("life")) {
			return "Life";
		}
		return raw.trim();
	}

	static boolean compatible(String policyCategory, String claimCategory) {
		String policy = normalize(policyCategory, "").toLowerCase(Locale.ROOT);
		String claim = claimCategory.toLowerCase(Locale.ROOT);
		if (policy.equals(claim) || claim.equals("general") || claim.equals("parametric")) {
			return true;
		}
		if (policy.equals("property") && (claim.contains("property") || claim.contains("home"))) {
			return true;
		}
		if (policy.equals("travel") && (claim.contains("travel") || claim.contains("trip")
				|| claim.contains("flight") || claim.contains("cancellation") || claim.contains("delay"))) {
			return true;
		}
		if (policy.equals("vehicle") && (claim.contains("vehicle") || claim.contains("motor") || claim.contains("car"))) {
			return true;
		}
		if (policy.equals("health") && claim.contains("health")) {
			return true;
		}
		if (policy.equals("life") && claim.contains("life")) {
			return true;
		}
		if (policy.equals("pet") && claim.contains("pet")) {
			return true;
		}
		return false;
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value.trim();
			}
		}
		return "";
	}
}
