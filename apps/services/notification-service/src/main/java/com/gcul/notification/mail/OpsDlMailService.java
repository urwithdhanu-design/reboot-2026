package com.gcul.notification.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

@Service
public class OpsDlMailService {

	private static final Logger log = LoggerFactory.getLogger(OpsDlMailService.class);

	private final JavaMailSender mailSender;
	private final OpsDlProperties properties;

	public OpsDlMailService(JavaMailSender mailSender, OpsDlProperties properties) {
		this.mailSender = mailSender;
		this.properties = properties;
	}

	public void sendToDl(String subject, String htmlBody) {
		if (!properties.isConfigured()) {
			log.warn("Ops DL email skipped (EMAIL_USER / gcul.ops.from-address not set): {}", subject);
			return;
		}
		for (String to : properties.recipients()) {
			sendOne(to, subject, htmlBody);
		}
	}

	private void sendOne(String to, String subject, String htmlBody) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(new InternetAddress(properties.getFromAddress().trim(), properties.getFromName(), "UTF-8"));
			helper.setTo(to.trim());
			helper.setSubject(subject);
			helper.setText(htmlBody, true);
			mailSender.send(message);
			log.info("Ops DL email sent to {} — {}", to, subject);
		}
		catch (Exception ex) {
			log.error("Failed ops DL email to {}: {}", to, ex.getMessage());
		}
	}
}
