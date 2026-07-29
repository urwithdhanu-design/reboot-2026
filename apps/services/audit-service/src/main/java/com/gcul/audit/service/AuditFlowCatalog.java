package com.gcul.audit.service;

import java.util.Locale;
import java.util.Map;

public final class AuditFlowCatalog {

	private AuditFlowCatalog() {
	}

	public static String flowFor(String eventType) {
		if (eventType == null || eventType.isBlank()) {
			return "system";
		}
		String key = eventType.trim();
		if (key.equals("AuditRecord")) {
			return "audit";
		}
		if (starts(key, "Customer", "Kyc")) {
			return "kyc";
		}
		if (starts(key, "Wallet")) {
			return "wallet";
		}
		if (starts(key, "Policy")) {
			return "policy";
		}
		if (starts(key, "Premium", "ClaimPaid")) {
			return "payment";
		}
		if (starts(key, "Claim", "Parametric")) {
			return "claims";
		}
		if (starts(key, "PolicyMinted", "Blockchain", "Canton")) {
			return "blockchain";
		}
		return "system";
	}

	private static boolean starts(String eventType, String... prefixes) {
		for (String prefix : prefixes) {
			if (eventType.startsWith(prefix)) {
				return true;
			}
		}
		return false;
	}

	public static String firstNonBlank(Map<String, Object> payload, String... keys) {
		for (String key : keys) {
			Object value = payload.get(key);
			if (value != null && !String.valueOf(value).isBlank()) {
				return String.valueOf(value).trim();
			}
		}
		return "";
	}

	public static String normalize(String value) {
		return value == null ? "" : value.trim();
	}

	public static String normalizeLower(String value) {
		return normalize(value).toLowerCase(Locale.ROOT);
	}
}
