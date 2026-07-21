package com.gcul.kyc.security;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.mail.MailService;
import com.gcul.kyc.model.PasswordResetToken;
import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.repository.PasswordResetTokenRepository;
import com.gcul.kyc.store.UserStore;

@Service
public class PasswordResetService {

	private final UserStore store;
	private final PasswordResetTokenRepository tokens;
	private final PasswordService passwords;
	private final MailService mail;
	private final long expiryMinutes;
	private final String webBaseUrl;

	public PasswordResetService(
			UserStore store,
			PasswordResetTokenRepository tokens,
			PasswordService passwords,
			MailService mail,
			@Value("${gcul.password-reset.expiry-minutes:30}") long expiryMinutes,
			@Value("${gcul.app.web-base-url:http://localhost:5173}") String webBaseUrl) {
		this.store = store;
		this.tokens = tokens;
		this.passwords = passwords;
		this.mail = mail;
		this.expiryMinutes = expiryMinutes;
		this.webBaseUrl = webBaseUrl.endsWith("/")
				? webBaseUrl.substring(0, webBaseUrl.length() - 1)
				: webBaseUrl;
	}

	@Transactional
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
		PasswordResetToken row = new PasswordResetToken();
		row.setToken(token);
		row.setUserId(user.getId());
		row.setExpiresAt(Instant.now().plusSeconds(expiryMinutes * 60));
		row.setUsed(false);
		tokens.save(row);

		String resetUrl = webBaseUrl + "/reset-password?token=" + token;
		boolean emailed = mail.sendPasswordReset(user.getEmail(), user.getFullName(), resetUrl, expiryMinutes);
		response.put("emailed", emailed);

		if (!emailed) {
			response.put("dev_reset_token", token);
			response.put("dev_reset_url", resetUrl);
		}
		return response;
	}

	@Transactional
	public Map<String, Object> resetPassword(String token, String newPassword) {
		if (token == null || token.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token is required");
		}
		if (newPassword == null || newPassword.length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		String trimmed = token.trim();
		PasswordResetToken reset = tokens.findByTokenAndUsedFalse(trimmed)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link"));

		if (Instant.now().isAfter(reset.getExpiresAt())) {
			reset.setUsed(true);
			tokens.save(reset);
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link");
		}

		UserAccount user = store.findById(reset.getUserId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link"));

		user.setPasswordHash(passwords.hash(newPassword));
		store.save(user);
		reset.setUsed(true);
		tokens.save(reset);

		return Map.of(
				"message", "Your password has been updated. You can sign in with your new password.",
				"email", user.getEmail());
	}
}
