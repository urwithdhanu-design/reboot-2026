package com.gcul.kyc.mail;

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

	/**
	 * @param contextTitle short event title shown in subject + email header
	 *                     (e.g. "Welcome", "Login confirmation")
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

	public void sendWelcome(String to, String fullName) {
		send(to, "Welcome", EmailTemplates.welcome(fullName, properties.getFromName()));
	}

	public boolean sendPasswordReset(String to, String fullName, String resetUrl, long expiryMinutes) {
		if (!isReady()) {
			log.warn("Password reset email skipped (not configured) → {}", to);
			return false;
		}
		if (to == null || to.isBlank()) {
			return false;
		}
		String platform = properties.getFromName();
		String subject = "Password reset · " + platform;
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(new InternetAddress(properties.getFromAddress().trim(), platform, "UTF-8"));
			helper.setTo(to.trim());
			helper.setSubject(subject);
			helper.setText(EmailTemplates.passwordReset(fullName, platform, resetUrl, expiryMinutes), true);
			mailSender.send(message);
			log.info("Password reset email sent to {}", to);
			return true;
		}
		catch (Exception ex) {
			log.error("Failed to send password reset to {}: {}", to, ex.getMessage());
			return false;
		}
	}
}
