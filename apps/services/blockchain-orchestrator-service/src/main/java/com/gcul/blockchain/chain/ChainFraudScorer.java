package com.gcul.blockchain.chain;

import org.springframework.stereotype.Component;

@Component
public class ChainFraudScorer {

	/**
	 * Demo AI-style risk score (0 = low, 1 = high). Replace with ML service later.
	 */
	public double score(String type, String payloadJson, String actorRole) {
		double risk = 0.05;
		if (payloadJson != null) {
			if (payloadJson.contains("\"amount\":") && payloadJson.matches("(?s).*\"amount\"\\s*:\\s*([5-9]\\d{3,}|\\d{6,}).*")) {
				risk += 0.35;
			}
			if (payloadJson.toLowerCase().contains("urgent") || payloadJson.toLowerCase().contains("override")) {
				risk += 0.2;
			}
		}
		if ("CLAIM_SETTLED".equals(type) || "SETTLEMENT".equals(type)) {
			risk += 0.1;
		}
		if (actorRole != null && actorRole.toLowerCase().contains("vendor")) {
			risk += 0.05;
		}
		return Math.min(1.0, risk);
	}
}
