package com.gcul.blockchain.ethereum;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

public final class PolicyReferenceHasher {

	private PolicyReferenceHasher() {
	}

	public static String hash(String policyId, String policyNumber, String customerId, String quoteId) {
		String payload = String.join("|",
				safe(policyId),
				safe(policyNumber),
				safe(customerId),
				safe(quoteId));
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return "0x" + HexFormat.of().formatHex(digest.digest(payload.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception ex) {
			throw new IllegalStateException("Unable to hash policy reference", ex);
		}
	}

	private static String safe(String value) {
		return value == null ? "" : value.trim();
	}
}
