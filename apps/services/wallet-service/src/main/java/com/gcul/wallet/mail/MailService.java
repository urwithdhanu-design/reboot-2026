package com.gcul.wallet.mail;

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

	public boolean sendWalletConsent(String to, String recipientName, String approveUrl, long expiryHours) {
		if (!isReady()) {
			log.warn("Wallet consent email skipped (not configured) → {}", to);
			return false;
		}
		if (to == null || to.isBlank()) {
			return false;
		}
		String platform = properties.getFromName();
		String subject = "Approve your wallet · " + platform;
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(new InternetAddress(properties.getFromAddress().trim(), platform, "UTF-8"));
			helper.setTo(to.trim());
			helper.setSubject(subject);
			String html = EmailTemplates.walletConsent(recipientName, platform, approveUrl, expiryHours);
			helper.setText(html, true);
			mailSender.send(message);
			log.info("Wallet consent email sent to {}", to);
			return true;
		}
		catch (Exception ex) {
			log.error("Failed to send wallet consent to {}: {}", to, ex.getMessage());
			return false;
		}
	}
}
