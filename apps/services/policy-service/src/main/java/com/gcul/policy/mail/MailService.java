package com.gcul.policy.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

@Service
public class MailService {

	private static final Logger log = LoggerFactory.getLogger(MailService.class);

	private final JavaMailSender mailSender;
	private final MailProperties properties;

	public MailService(JavaMailSender mailSender, MailProperties properties) {
		this.mailSender = mailSender;
		this.properties = properties;
	}

	public boolean isReady() {
		return properties.isEnabled()
				&& properties.getFromAddress() != null
				&& !properties.getFromAddress().isBlank();
	}

	public String platformName() {
		return properties.getFromName();
	}

	/**
	 * @param contextTitle short event title shown in subject + email header
	 */
	public void send(String to, String contextTitle, String htmlBody) {
		if (!isReady()) {
			log.warn("Email skipped (not configured): {} → {}", contextTitle, to);
			return;
		}
		if (to == null || to.isBlank()) {
			log.warn("Email skipped (no recipient): {}", contextTitle);
			return;
		}

		String platform = properties.getFromName();
		String subject = contextTitle + " · " + platform;

		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(new InternetAddress(properties.getFromAddress().trim(), platform, "UTF-8"));
			helper.setTo(to.trim());
			helper.setSubject(subject);
			helper.setText(htmlBody, true);
			mailSender.send(message);
			log.info("Email sent [{}] to {}", contextTitle, to);
		}
		catch (Exception ex) {
			log.error("Failed to send email [{}] to {}: {}", contextTitle, to, ex.getMessage());
		}
	}

	public void sendQuoteReady(
			String to,
			String customerName,
			String productTitle,
			String quoteId,
			double premium,
			String priceUnit) {
		send(to, "Your quote is ready",
				EmailTemplates.quoteReady(
						customerName, productTitle, quoteId, premium, priceUnit, properties.getFromName()));
	}

	public void sendPaymentReceived(
			String to,
			String productTitle,
			String quoteId,
			double amount,
			String currency) {
		send(to, "Payment received",
				EmailTemplates.paymentReceived(
						productTitle, quoteId, amount, currency, properties.getFromName()));
	}

	public void sendVendorInvite(
			String to,
			String contactName,
			String vendorName,
			String loginEmail,
			String tempPassword,
			String vendorCode) {
		send(to, "Vendor portal invite",
				VendorEmailTemplates.invite(
						contactName, vendorName, loginEmail, tempPassword, vendorCode, properties.getFromName()));
	}

	public void sendVendorPublished(
			String to,
			String contactName,
			String vendorName,
			String uiUrl,
			String version) {
		send(to, "Vendor UI published",
				VendorEmailTemplates.published(
						contactName, vendorName, uiUrl, version, properties.getFromName()));
	}
}
