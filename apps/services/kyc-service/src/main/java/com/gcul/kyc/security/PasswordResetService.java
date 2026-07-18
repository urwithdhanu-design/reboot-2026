package com.gcul.kyc.security;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.mail.MailService;
import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.store.UserStore;

@Service
public class PasswordResetService {

	private record ResetToken(String userId, Instant expiresAt, boolean used) {
	}

	private final UserStore store;
	private final PasswordService passwords;
	private final MailService mail;
	private final Map<String, ResetToken> tokens = new ConcurrentHashMap<>();
	private final long expiryMinutes;
	private final String webBaseUrl;

	public PasswordResetService(
			UserStore store,
			PasswordService passwords,
			MailService mail,
			@Value("${gcul.password-reset.expiry-minutes:30}") long expiryMinutes,
			@Value("${gcul.app.web-base-url:http://localhost:5173}") String webBaseUrl) {
		this.store = store;
		this.passwords = passwords;
		this.mail = mail;
		this.expiryMinutes = expiryMinutes;
		this.webBaseUrl = webBaseUrl.endsWith("/")
				? webBaseUrl.substring(0, webBaseUrl.length() - 1)
				: webBaseUrl;
	}

	public Map<String, Object> requestReset(String identifier) {
		String key = identifier == null ? "" : identifier.trim();
		Optional<UserAccount> userOpt = store.findByEmail(key)
				.or(() -> store.findByMobile(key));

		Map<String, Object> response = new java.util.LinkedHashMap<>();
		response.put("message",
				"If an account exists for that email or phone, you will receive reset instructions shortly.");
		response.put("emailed", false);

		if (userOpt.isEmpty()) {
			return response;
		}

		UserAccount user = userOpt.get();
		String token = UUID.randomUUID().toString().replace("-", "");
		tokens.put(token, new ResetToken(
				user.getId(),
				Instant.now().plusSeconds(expiryMinutes * 60),
				false));

		String resetUrl = webBaseUrl + "/reset-password?token=" + token;
		boolean emailed = mail.sendPasswordReset(user.getEmail(), user.getFullName(), resetUrl, expiryMinutes);
		response.put("emailed", emailed);

		// When SMTP is not configured, return the link so the demo flow still works.
		if (!emailed) {
			response.put("dev_reset_token", token);
			response.put("dev_reset_url", resetUrl);
		}
		return response;
	}

	public Map<String, Object> resetPassword(String token, String newPassword) {
		if (token == null || token.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token is required");
		}
		if (newPassword == null || newPassword.length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		ResetToken reset = tokens.get(token.trim());
		if (reset == null || reset.used()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link");
		}
		if (Instant.now().isAfter(reset.expiresAt())) {
			tokens.remove(token.trim());
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link");
		}

		UserAccount user = store.findById(reset.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link"));

		user.setPasswordHash(passwords.hash(newPassword));
		store.save(user);
		tokens.put(token.trim(), new ResetToken(reset.userId(), reset.expiresAt(), true));

		return Map.of(
				"message", "Your password has been updated. You can sign in with your new password.",
				"email", user.getEmail());
	}
}
