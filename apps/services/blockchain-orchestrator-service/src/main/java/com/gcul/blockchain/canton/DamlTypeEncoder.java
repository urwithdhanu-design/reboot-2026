package com.gcul.blockchain.canton;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Encodes Java values for Daml JSON Ledger API payloads.
 */
public final class DamlTypeEncoder {

	private static final DateTimeFormatter DAML_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
			.withZone(ZoneOffset.UTC);

	private DamlTypeEncoder() {
	}

	public static String time(Instant instant) {
		if (instant == null) {
			return DAML_TIME.format(Instant.now());
		}
		return DAML_TIME.format(instant);
	}

	public static String decimal(double value) {
		return decimal(BigDecimal.valueOf(value));
	}

	public static String decimal(BigDecimal value) {
		if (value == null) {
			return "0";
		}
		return value.setScale(10, RoundingMode.HALF_UP)
				.stripTrailingZeros()
				.toPlainString();
	}
}
