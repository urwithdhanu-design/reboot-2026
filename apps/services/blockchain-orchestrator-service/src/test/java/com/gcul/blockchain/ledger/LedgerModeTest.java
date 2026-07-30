package com.gcul.blockchain.ledger;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class LedgerModeTest {

	@Test
	void fromLedgerIdRecognizesCanton() {
		assertEquals(LedgerMode.CANTON, LedgerMode.fromLedgerId("canton"));
		assertEquals(LedgerMode.CANTON, LedgerMode.fromLedgerId("Canton"));
	}

	@Test
	void fromLedgerIdRecognizesFailed() {
		assertEquals(LedgerMode.FAILED, LedgerMode.fromLedgerId("failed"));
	}

	@Test
	void fromLedgerIdDefaultsSimulated() {
		assertEquals(LedgerMode.SIMULATED, LedgerMode.fromLedgerId("simulated"));
		assertEquals(LedgerMode.SIMULATED, LedgerMode.fromLedgerId(""));
	}

	@Test
	void normalizeDetectsCantonSubstring() {
		assertEquals(LedgerMode.CANTON, LedgerMode.normalize("canton-json"));
		assertEquals(LedgerMode.FAILED, LedgerMode.normalize("mint_failed"));
	}
}
