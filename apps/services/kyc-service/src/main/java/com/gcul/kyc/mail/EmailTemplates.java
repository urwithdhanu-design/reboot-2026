package com.gcul.kyc.mail;

final class EmailTemplates {

	private EmailTemplates() {
	}

	static String welcome(String fullName, String platform) {
		String name = escape(fullName == null || fullName.isBlank() ? "there" : fullName);
		String brand = escape(platform);
		return layout(
				brand,
				"Welcome",
				"""
				<p>Hello %s,</p>
				<p>Your account on <strong>%s</strong> is ready. You can sign in to complete KYC,
				create your digital wallet, and explore insurance products.</p>
				<div class="box">
				  <div class="label">Next steps</div>
				  <div class="value">Complete KYC → Create wallet → Get a quote</div>
				</div>
				<p>If you did not create this account, you can ignore this email.</p>
				""".formatted(name, brand));
	}

	static String passwordReset(String fullName, String platform, String resetUrl, long expiryMinutes) {
		String name = escape(fullName == null || fullName.isBlank() ? "there" : fullName);
		String brand = escape(platform);
		String url = escape(resetUrl);
		return layout(
				brand,
				"Password reset",
				"""
				<p>Hello %s,</p>
				<p>We received a request to reset your password for <strong>%s</strong>.</p>
				<div class="box">
				  <div class="label">Reset link</div>
				  <div class="value"><a href="%s" style="color:#006a4d;font-weight:700;">Choose a new password</a></div>
				</div>
				<p>This link expires in <strong>%d minutes</strong>. If you did not request a reset, you can ignore this email.</p>
				<p style="font-size:12px;color:#6b736f;word-break:break-all;">%s</p>
				""".formatted(name, brand, url, expiryMinutes, url));
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
}
