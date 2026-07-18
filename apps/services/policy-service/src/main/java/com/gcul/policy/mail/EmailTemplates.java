package com.gcul.policy.mail;

final class EmailTemplates {

	private EmailTemplates() {
	}

	static String quoteReady(
			String customerName,
			String productTitle,
			String quoteId,
			double premium,
			String priceUnit,
			String platform) {
		String name = escape(blankTo(customerName, "there"));
		String product = escape(blankTo(productTitle, "Insurance"));
		String qid = escape(blankTo(quoteId, "—"));
		String amount = String.format("£%.2f / %s", premium, escape(blankTo(priceUnit, "month")));
		String brand = escape(platform);
		return layout(
				brand,
				"Your quote is ready",
				"""
				<p>Hello %s,</p>
				<p>Thanks for using <strong>%s</strong>. Your estimated premium is ready.</p>
				<div class="box">
				  <div class="detail-row"><div class="label">Product</div><div class="value">%s</div></div>
				  <div class="detail-row"><div class="label">Quote ID</div><div class="value">%s</div></div>
				  <div class="detail-row"><div class="label">Estimated premium</div><div class="value">%s</div></div>
				</div>
				<p>Open the app to review your quote and pay your first premium securely with Stripe.</p>
				""".formatted(name, brand, product, qid, amount));
	}

	static String paymentReceived(
			String productTitle,
			String quoteId,
			double amount,
			String currency,
			String platform) {
		String product = escape(blankTo(productTitle, "Insurance"));
		String qid = escape(blankTo(quoteId, "—"));
		String paid = String.format("%s %.2f", escape(blankTo(currency, "gbp")).toUpperCase(), amount);
		String brand = escape(platform);
		return layout(
				brand,
				"Payment received",
				"""
				<p>Thank you — we’ve received your payment on <strong>%s</strong>.</p>
				<div class="box">
				  <div class="detail-row"><div class="label">Product</div><div class="value">%s</div></div>
				  <div class="detail-row"><div class="label">Quote ID</div><div class="value">%s</div></div>
				  <div class="detail-row"><div class="label">Amount paid</div><div class="value">%s</div></div>
				</div>
				<p>You can manage your policy from the Policies tab in the app.</p>
				""".formatted(brand, product, qid, paid));
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
				    .detail-row { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
				    .detail-row:last-child { border-bottom: none; }
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

	private static String blankTo(String value, String fallback) {
		return value == null || value.isBlank() ? fallback : value;
	}

	private static String escape(String value) {
		return String.valueOf(value == null ? "" : value)
				.replace("&", "&amp;")
				.replace("<", "&lt;")
				.replace(">", "&gt;")
				.replace("\"", "&quot;");
	}
}
