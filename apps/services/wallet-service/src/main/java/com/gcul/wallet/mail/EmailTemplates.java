package com.gcul.wallet.mail;

final class EmailTemplates {

	private static final String APPROVE_BUTTON_STYLE = "display:inline-block;background-color:#006a4d;color:#ffffff;"
			+ "text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;font-size:16px;"
			+ "border:1px solid #006a4d;font-family:'Segoe UI',Arial,sans-serif;";

	private EmailTemplates() {
	}

	static String walletConsent(String recipientName, String platform, String approveUrl, long expiryHours) {
		String name = escape(recipientName == null || recipientName.isBlank() ? "there" : recipientName);
		String brand = escape(platform);
		String href = escapeAttribute(approveUrl);
		String urlPlain = escape(approveUrl == null ? "" : approveUrl);
		return layout(
				brand,
				"Approve your wallet",
				"""
				<p>Hello %s,</p>
				<p>You requested to link a digital wallet on <strong>%s</strong> for insurance policy storage and claim payouts.</p>
				<div class="box">
				  <div class="label">Consent</div>
				  <div class="value">By approving, you authorise this wallet address to receive policy NFTs and payout credits on your account.</div>
				</div>
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto;">
				  <tr>
				    <td align="center" bgcolor="#006a4d" style="border-radius:10px;background-color:#006a4d;">
				      <a href="%s" style="%s">Approve wallet</a>
				    </td>
				  </tr>
				</table>
				<div class="box">
				  <div class="label">Or open this link</div>
				  <div class="value"><a href="%s" style="color:#006a4d;font-weight:700;word-break:break-all;">Approve wallet</a></div>
				</div>
				<p>This link expires in <strong>%d hours</strong> and can only be used once. If you did not request this, you can ignore this email.</p>
				<p style="font-size:12px;color:#6b736f;word-break:break-all;">%s</p>
				""".formatted(name, brand, href, APPROVE_BUTTON_STYLE, href, expiryHours, urlPlain));
	}

	static String walletConsentPlainText(String recipientName, String platform, String approveUrl, long expiryHours) {
		String name = recipientName == null || recipientName.isBlank() ? "there" : recipientName.trim();
		String brand = platform == null || platform.isBlank() ? "Reboot 2026 Insurance" : platform.trim();
		String url = approveUrl == null ? "" : approveUrl.trim();
		return """
				Hello %s,

				Approve your wallet on %s by opening this link:
				%s

				This link expires in %d hours and can only be used once.

				If you did not request this, you can ignore this email.
				""".formatted(name, brand, url, expiryHours);
	}

	static String layout(String platform, String contextTitle, String bodyHtml) {
		return """
				<!DOCTYPE html>
				<html>
				<head>
				  <meta charset="utf-8" />
				  <meta name="viewport" content="width=device-width, initial-scale=1" />
				  <style>
				    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1a1f1c; margin: 0; background: #e6f3ee; }
				    .wrap { padding: 24px 12px; }
				    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,106,77,0.12); }
				    .header { background: linear-gradient(135deg, #006a4d 0%%, #004d38 100%%); color: white; padding: 28px 24px; }
				    .header .brand { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.92; }
				    .header h1 { margin: 8px 0 0; font-size: 22px; font-weight: 700; }
				    .content { padding: 24px; background: #fafafa; }
				    .box { background: white; padding: 16px 18px; border-radius: 10px; margin: 16px 0; border: 1px solid #e4ebe7; border-left: 4px solid #006a4d; }
				    .label { font-size: 11px; color: #6b736f; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; font-weight: 600; }
				    .value { font-size: 15px; font-weight: 600; color: #111; word-break: break-word; }
				    .footer { text-align: center; padding: 18px 24px 24px; color: #9ca3af; font-size: 12px; background: #fff; }
				  </style>
				</head>
				<body>
				  <div class="wrap">
				    <div class="container">
				      <div class="header">
				        <p class="brand">%s</p>
				        <h1>%s</h1>
				      </div>
				      <div class="content">%s</div>
				      <div class="footer">Automated message from %s · Please do not reply directly to this email.</div>
				    </div>
				  </div>
				</body>
				</html>
				""".formatted(escape(platform), escape(contextTitle), bodyHtml, escape(platform));
	}

	private static String escape(String value) {
		return String.valueOf(value == null ? "" : value)
				.replace("&", "&amp;")
				.replace("<", "&lt;")
				.replace(">", "&gt;")
				.replace("\"", "&quot;");
	}

	private static String escapeAttribute(String value) {
		return escape(value);
	}
}
