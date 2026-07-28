package com.gcul.wallet.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.wallet.mail.MailService;
import com.gcul.wallet.messaging.WalletEventPublisher;
import com.gcul.wallet.model.CustomerWallet;
import com.gcul.wallet.model.WalletConsentToken;
import com.gcul.wallet.repository.CustomerWalletRepository;
import com.gcul.wallet.repository.WalletConsentTokenRepository;

@Service
public class WalletConsentService {

	public static final String STATUS_PENDING = "pending_consent";

	private final WalletConsentTokenRepository tokens;
	private final CustomerWalletRepository wallets;
	private final MailService mail;
	private final WalletEventPublisher walletEvents;
	private final SecureRandom random = new SecureRandom();
	private final long expiryHours;
	private final String webBaseUrl;

	public WalletConsentService(
			WalletConsentTokenRepository tokens,
			CustomerWalletRepository wallets,
			MailService mail,
			WalletEventPublisher walletEvents,
			@Value("${gcul.wallet-consent.expiry-hours:48}") long expiryHours,
			@Value("${gcul.app.web-base-url:http://localhost:5173}") String webBaseUrl) {
		this.tokens = tokens;
		this.wallets = wallets;
		this.mail = mail;
		this.walletEvents = walletEvents;
		this.expiryHours = expiryHours;
		String normalized = webBaseUrl == null ? "" : webBaseUrl.trim();
		this.webBaseUrl = normalized.endsWith("/")
				? normalized.substring(0, normalized.length() - 1)
				: normalized;
	}

	public Map<String, Object> issueConsentEmail(
			CustomerWallet wallet,
			String recipientEmail,
			String recipientName) {
		invalidatePendingTokens(wallet.getUserId());

		if (recipientEmail == null || recipientEmail.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Account email is required to send wallet approval");
		}

		String to = recipientEmail.trim().toLowerCase(Locale.ROOT);
		String name = recipientName == null || recipientName.isBlank() ? to : recipientName.trim();

		String rawToken = generateToken();
		WalletConsentToken row = new WalletConsentToken();
		row.setTokenHash(hashToken(rawToken));
		row.setUserId(wallet.getUserId());
		row.setExpiresAt(Instant.now().plusSeconds(expiryHours * 3600));
		row.setCreatedAt(Instant.now());
		tokens.save(row);

		String approveUrl = webBaseUrl + "/wallet/approve?token=" + rawToken;
		boolean emailed = mail.sendWalletConsent(to, name, approveUrl.trim(), expiryHours);

		Map<String, Object> result = new LinkedHashMap<>();
		result.put("consent_email_sent", emailed);
		result.put("consent_email_to", to);
		result.put("pending_approval", true);
		if (!emailed) {
			result.put("dev_approve_url", approveUrl);
			result.put("dev_approve_token", rawToken);
		}
		return result;
	}

	@Transactional
	public Map<String, Object> approveByToken(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approval token is required");
		}

		String tokenHash = hashToken(rawToken.trim());
		WalletConsentToken consent = tokens.findByTokenHashAndUsedAtIsNull(tokenHash)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Invalid or expired approval link"));

		if (Instant.now().isAfter(consent.getExpiresAt())) {
			consent.setUsedAt(Instant.now());
			tokens.save(consent);
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired approval link");
		}

		CustomerWallet wallet = wallets.findByUserId(consent.getUserId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Invalid or expired approval link"));

		return activateWallet(wallet, consent);
	}

	@Transactional
	public Map<String, Object> activateWallet(CustomerWallet wallet, WalletConsentToken consent) {
		if (!consent.getUserId().equals(wallet.getUserId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired approval link");
		}

		if ("connected".equals(wallet.getStatus()) && wallet.getAddress() != null) {
			consent.setUsedAt(Instant.now());
			tokens.save(consent);
			return approvalResponse(wallet, true, "Your wallet is already approved and active.");
		}

		if (!STATUS_PENDING.equals(wallet.getStatus())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Wallet is not awaiting email approval");
		}

		Instant approvedAt = Instant.now();
		wallet.setStatus("connected");
		wallet.setConsentApprovedAt(approvedAt);
		wallet.setUpdatedAt(approvedAt);
		wallets.saveAndFlush(wallet);

		consent.setUsedAt(approvedAt);
		tokens.save(consent);
		invalidatePendingTokens(wallet.getUserId(), consent.getTokenHash());

		walletEvents.walletLinked(wallet.getUserId(), wallet);

		return approvalResponse(wallet, false, "Your wallet has been approved and is now active.");
	}

	private Map<String, Object> approvalResponse(CustomerWallet wallet, boolean alreadyActive, String message) {
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("message", message);
		result.put("status", wallet.getStatus());
		result.put("address", wallet.getAddress() == null ? "" : wallet.getAddress());
		result.put("user_id", wallet.getUserId());
		result.put("already_active", alreadyActive);
		result.put("consent_approved", true);
		if (wallet.getConsentApprovedAt() != null) {
			result.put("consent_approved_at", wallet.getConsentApprovedAt().toString());
		}
		return result;
	}

	private void invalidatePendingTokens(String userId) {
		invalidatePendingTokens(userId, null);
	}

	private void invalidatePendingTokens(String userId, String exceptHash) {
		List<WalletConsentToken> pending = tokens.findByUserIdAndUsedAtIsNull(userId);
		Instant now = Instant.now();
		for (WalletConsentToken row : pending) {
			if (exceptHash != null && exceptHash.equals(row.getTokenHash())) {
				continue;
			}
			row.setUsedAt(now);
			tokens.save(row);
		}
	}

	private String generateToken() {
		byte[] bytes = new byte[32];
		random.nextBytes(bytes);
		return HexFormat.of().formatHex(bytes);
	}

	static String hashToken(String rawToken) {
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(md.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Token processing failed");
		}
	}
}
