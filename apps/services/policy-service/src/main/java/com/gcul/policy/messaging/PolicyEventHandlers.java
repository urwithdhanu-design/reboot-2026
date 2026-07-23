package com.gcul.policy.messaging;

import java.util.Map;

import org.springframework.stereotype.Component;

@Component
public class PolicyEventHandlers {

	private final PolicyIssuanceService issuance;

	public PolicyEventHandlers(PolicyIssuanceService issuance) {
		this.issuance = issuance;
	}

	public boolean handlePayment(String eventType, Map<String, Object> payload) {
		if ("PremiumPaid".equals(eventType)) {
			issuance.onPremiumPaid(payload);
			return true;
		}
		return false;
	}

	public boolean handleBlockchain(String eventType, Map<String, Object> payload) {
		if ("PolicyMinted".equals(eventType)) {
			issuance.onPolicyMinted(payload);
			return true;
		}
		return false;
	}

	public boolean handleWallet(String eventType, Map<String, Object> payload) {
		if ("WalletLinked".equals(eventType)) {
			issuance.onWalletLinked(payload);
			return true;
		}
		return false;
	}
}
