package com.gcul.blockchain.ledger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.gcul.blockchain.config.CantonProperties;

class LedgerAttestationTest {

	private CantonProperties cantonProperties;

	@BeforeEach
	void setUp() {
		cantonProperties = new CantonProperties();
		cantonProperties.setPackageId("pkg-test-123");
	}

	@Test
	void fromMintMarksCantonVerified() {
		PolicyNftMintResult result = new PolicyNftMintResult(
				"POL-001",
				"hash",
				"#contract:1",
				"update-1",
				"0xabc",
				"Gcul.InsurancePolicy:InsurancePolicy",
				0L,
				42L,
				"Canton Local Sandbox",
				"uri",
				"canton",
				"MINTED",
				"canton",
				"pkg-from-mint");

		Map<String, Object> attestation = LedgerAttestation.fromMint(result, cantonProperties);
		assertEquals("canton", attestation.get("ledger_mode"));
		assertTrue((Boolean) attestation.get("verified"));
		assertEquals("pkg-from-mint", attestation.get("packageId"));
		assertEquals("#contract:1", attestation.get("contract_id"));
	}

	@Test
	void fromMintSimulatedNotVerified() {
		PolicyNftMintResult result = new PolicyNftMintResult(
				"POL-002",
				"hash",
				"sim-token",
				"sim-tx",
				"0xabc",
				"simulated",
				0L,
				0L,
				"simulated",
				"uri",
				"simulated",
				"MINTED",
				"simulated",
				"");

		Map<String, Object> attestation = LedgerAttestation.fromMint(result, cantonProperties);
		assertEquals("simulated", attestation.get("ledger_mode"));
		assertFalse((Boolean) attestation.get("verified"));
		assertEquals("pkg-test-123", attestation.get("packageId"));
	}
}
