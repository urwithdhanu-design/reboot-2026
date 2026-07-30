package com.gcul.blockchain.canton;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Instant;

import org.junit.jupiter.api.Test;

class DamlTypeEncoderTest {

	@Test
	void timeFormatsUtcWithMillis() {
		String encoded = DamlTypeEncoder.time(Instant.parse("2026-01-15T10:30:00.123Z"));
		assertEquals("2026-01-15T10:30:00.123Z", encoded);
	}

	@Test
	void decimalStripsTrailingZeros() {
		assertEquals("1000000", DamlTypeEncoder.decimal(1000000.0));
		assertEquals("5.25", DamlTypeEncoder.decimal(new BigDecimal("5.2500000000")));
	}

	@Test
	void decimalNullDefaultsToZero() {
		assertEquals("0", DamlTypeEncoder.decimal(null));
	}
}
