package com.gcul.wallet.mail;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class EmailTemplatesTest {

	@Test
	void walletConsentIncludesVisibleApproveButtonAndLink() {
		String html = EmailTemplates.walletConsent(
				"Alex",
				"Reboot 2026 Insurance",
				"https://example.com/wallet/approve?token=abc123",
				48);

		assertTrue(html.contains("Approve wallet"));
		assertTrue(html.contains("href=\"https://example.com/wallet/approve?token=abc123\""));
		assertTrue(html.contains("background-color:#006a4d"));
		assertTrue(html.contains("Or open this link"));
	}

	@Test
	void walletConsentPlainTextIncludesApprovalUrl() {
		String plain = EmailTemplates.walletConsentPlainText(
				"Alex",
				"Reboot 2026 Insurance",
				"https://example.com/wallet/approve?token=abc123",
				48);

		assertTrue(plain.contains("Approve your wallet"));
		assertTrue(plain.contains("https://example.com/wallet/approve?token=abc123"));
	}
}
