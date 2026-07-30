package com.gcul.blockchain.ledger;

import org.springframework.util.StringUtils;

/**
 * Honest ledger attestation mode — whether a mint/verify reflects real Canton state.
 */
public enum LedgerMode {
	CANTON("canton"),
	SIMULATED("simulated"),
	FAILED("failed");

	private final String id;

	LedgerMode(String id) {
		this.id = id;
	}

	public String id() {
		return id;
	}

	public static LedgerMode fromLedgerId(String ledgerId) {
		if (!StringUtils.hasText(ledgerId)) {
			return SIMULATED;
		}
		String normalized = ledgerId.trim().toLowerCase();
		if ("canton".equals(normalized)) {
			return CANTON;
		}
		if ("failed".equals(normalized)) {
			return FAILED;
		}
		return SIMULATED;
	}

	public static LedgerMode normalize(String value) {
		if (!StringUtils.hasText(value)) {
			return SIMULATED;
		}
		String normalized = value.trim().toLowerCase();
		if ("canton".equals(normalized) || normalized.contains("canton")) {
			return CANTON;
		}
		if ("failed".equals(normalized) || "mint_failed".equals(normalized)) {
			return FAILED;
		}
		return SIMULATED;
	}
}
