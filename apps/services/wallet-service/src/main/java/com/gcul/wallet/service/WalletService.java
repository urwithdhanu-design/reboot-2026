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
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.wallet.client.KycStatusClient;
import com.gcul.wallet.messaging.WalletEventPublisher;
import com.gcul.wallet.model.CustomerWallet;
import com.gcul.wallet.model.WalletTransaction;
import com.gcul.wallet.repository.CustomerWalletRepository;
import com.gcul.wallet.repository.WalletTransactionRepository;

@Service
public class WalletService {

	private static final double MAX_RECHARGE = 10_000.0;

	private final CustomerWalletRepository repository;
	private final WalletTransactionRepository transactions;
	private final KycStatusClient kycStatusClient;
	private final WalletEventPublisher walletEvents;
	private final SecureRandom random = new SecureRandom();

	public WalletService(
			CustomerWalletRepository repository,
			WalletTransactionRepository transactions,
			KycStatusClient kycStatusClient,
			WalletEventPublisher walletEvents) {
		this.repository = repository;
		this.transactions = transactions;
		this.kycStatusClient = kycStatusClient;
		this.walletEvents = walletEvents;
	}

	public Map<String, Object> getWallet(String userId) {
		return repository.findByUserId(userId)
				.map(this::toResponse)
				.orElseGet(() -> {
					Map<String, Object> disconnected = new LinkedHashMap<>();
					disconnected.put("status", "disconnected");
					disconnected.put("address", null);
					disconnected.put("balance_gbp", 0.0);
					disconnected.put("currency", "GBP");
					return disconnected;
				});
	}

	public List<Map<String, Object>> listTransactions(String userId) {
		return transactions.findTop20ByUserIdOrderByCreatedAtDesc(userId).stream()
				.map(this::toTransactionResponse)
				.toList();
	}

	@Transactional
	public Map<String, Object> createWallet(String userId, String email, String bearerToken) {
		var existing = repository.findByUserId(userId);
		if (existing.isPresent() && existing.get().isConnected()) {
			Map<String, Object> map = toResponse(existing.get());
			map.put("reused", true);
			return map;
		}

		if (!"verified".equals(kycStatusClient.fetchKycStatus(bearerToken))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Complete KYC verification before creating a wallet");
		}

		CustomerWallet wallet = existing.orElseGet(CustomerWallet::new);
		wallet.setUserId(userId);
		wallet.setUserEmail(email);
		wallet.setAddress(generateAddress(userId, email));
		wallet.setStatus("connected");
		wallet.setProvider("secure_wallet");
		wallet.setMode("demo");
		wallet.setNote("Demo digital account for policy storage and payouts.");
		wallet.setCurrency("GBP");
		if (wallet.getBalanceGbp() < 0) {
			wallet.setBalanceGbp(0.0);
		}
		wallet.setUpdatedAt(Instant.now());

		try {
			repository.saveAndFlush(wallet);
		}
		catch (DataIntegrityViolationException ex) {
			wallet = repository.findByUserId(userId)
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
							"Wallet already exists for this account"));
			if (!wallet.isConnected()) {
				wallet.setUserEmail(email);
				wallet.setAddress(generateAddress(userId, email));
				wallet.setStatus("connected");
				wallet.setProvider("secure_wallet");
				wallet.setMode("demo");
				wallet.setNote("Demo digital account for policy storage and payouts.");
				wallet.setCurrency("GBP");
				wallet.setUpdatedAt(Instant.now());
				wallet = repository.saveAndFlush(wallet);
			}
		}

		walletEvents.walletLinked(userId, wallet);

		Map<String, Object> response = toResponse(wallet);
		response.put("ledger", "gcul");
		response.put("reused", existing.isPresent());
		return response;
	}

	@Transactional
	public Map<String, Object> rechargeWallet(String userId, double amount) {
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recharge amount must be greater than zero");
		}
		if (amount > MAX_RECHARGE) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Recharge amount cannot exceed £" + (int) MAX_RECHARGE);
		}

		CustomerWallet wallet = repository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Create a wallet before recharging"));
		if (!wallet.isConnected()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Create a wallet before recharging");
		}

		wallet.setBalanceGbp(roundMoney(wallet.getBalanceGbp() + amount));
		wallet.setUpdatedAt(Instant.now());
		wallet = repository.saveAndFlush(wallet);

		WalletTransaction tx = new WalletTransaction();
		tx.setId("RCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		tx.setUserId(userId);
		tx.setType("recharge");
		tx.setAmount(roundMoney(amount));
		tx.setCurrency(wallet.getCurrency() == null ? "GBP" : wallet.getCurrency());
		tx.setStatus("completed");
		tx.setReference("demo-top-up");
		tx.setCreatedAt(Instant.now());
		tx = transactions.saveAndFlush(tx);

		walletEvents.walletRecharged(userId, wallet, tx);

		Map<String, Object> response = toResponse(wallet);
		response.put("transaction", toTransactionResponse(tx));
		return response;
	}

	private String generateAddress(String userId, String email) {
		String seed = userId + ":" + (email == null ? "" : email) + ":" + HexFormat.of().formatHex(randomBytes(16));
		String digest = sha256(seed);
		return "0x" + digest.substring(0, 40);
	}

	private Map<String, Object> toResponse(CustomerWallet wallet) {
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("status", wallet.getStatus());
		result.put("address", wallet.getAddress());
		result.put("provider", wallet.getProvider() == null ? "secure_wallet" : wallet.getProvider());
		result.put("mode", wallet.getMode() == null ? "demo" : wallet.getMode());
		result.put("balance_gbp", roundMoney(wallet.getBalanceGbp()));
		result.put("currency", wallet.getCurrency() == null ? "GBP" : wallet.getCurrency());
		if (wallet.getNote() != null) {
			result.put("note", wallet.getNote());
		}
		return result;
	}

	private Map<String, Object> toTransactionResponse(WalletTransaction tx) {
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("id", tx.getId());
		result.put("type", tx.getType());
		result.put("amount", roundMoney(tx.getAmount()));
		result.put("currency", tx.getCurrency());
		result.put("status", tx.getStatus());
		result.put("reference", tx.getReference());
		result.put("created_at", tx.getCreatedAt().toString());
		return result;
	}

	private static double roundMoney(double value) {
		return Math.round(value * 100.0) / 100.0;
	}

	private byte[] randomBytes(int len) {
		byte[] bytes = new byte[len];
		random.nextBytes(bytes);
		return bytes;
	}

	private String sha256(String value) {
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Wallet address failed");
		}
	}
}
