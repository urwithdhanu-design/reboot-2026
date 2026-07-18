package com.gcul.policy.mail;

final class VendorEmailTemplates {

	private VendorEmailTemplates() {
	}

	static String invite(
			String contactName,
			String vendorName,
			String loginEmail,
			String tempPassword,
			String vendorCode,
			String platform) {
		String name = esc(blank(contactName, "there"));
		String vendor = esc(blank(vendorName, "your organisation"));
		String brand = esc(platform);
		return EmailTemplates.layout(
				brand,
				"Vendor portal invite",
				"""
				<p>Hello %s,</p>
				<p>You have been onboarded as an insurance vendor on <strong>%s</strong>.</p>
				<div class="box">
				  <div class="detail-row"><div class="label">Vendor</div><div class="value">%s</div></div>
				  <div class="detail-row"><div class="label">Vendor code</div><div class="value">%s</div></div>
				  <div class="detail-row"><div class="label">Portal login</div><div class="value">%s</div></div>
				  <div class="detail-row"><div class="label">Temporary password</div><div class="value">%s</div></div>
				</div>
				<p>Sign in at the admin Vendor Portal (<code>/vendor/login</code>) to view customers, products, and claims linked to your cover.</p>
				<p>Please change your password after first login.</p>
				""".formatted(name, brand, vendor, esc(vendorCode), esc(loginEmail), esc(tempPassword)));
	}

	static String published(
			String contactName,
			String vendorName,
			String uiUrl,
			String version,
			String platform) {
		String name = esc(blank(contactName, "there"));
		String brand = esc(platform);
		return EmailTemplates.layout(
				brand,
				"Vendor UI published",
				"""
				<p>Hello %s,</p>
				<p>Your vendor experience for <strong>%s</strong> has been published on <strong>%s</strong>.</p>
				<div class="box">
				  <div class="detail-row"><div class="label">UI deploy URL</div><div class="value">%s</div></div>
				  <div class="detail-row"><div class="label">Version</div><div class="value">%s</div></div>
				</div>
				<p>Connected quote and product APIs are live for this vendor configuration.</p>
				""".formatted(name, esc(vendorName), brand, esc(uiUrl), esc(version)));
	}

	private static String blank(String value, String fallback) {
		return value == null || value.isBlank() ? fallback : value;
	}

	private static String esc(String value) {
		return String.valueOf(value == null ? "" : value)
				.replace("&", "&amp;")
				.replace("<", "&lt;")
				.replace(">", "&gt;")
				.replace("\"", "&quot;");
	}
}
