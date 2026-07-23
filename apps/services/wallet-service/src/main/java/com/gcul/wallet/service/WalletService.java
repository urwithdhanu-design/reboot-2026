package com.gcul.wallet.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.wallet.client.KycStatusClient;
import com.gcul.wallet.messaging.WalletEventPublisher;
import com.gcul.wallet.model.CustomerWallet;
import com.gcul.wallet.repository.CustomerWalletRepository;

@Service
public class WalletService {

	private final CustomerWalletRepository repository;
	private final KycStatusClient kycStatusClient;
	private final WalletEventPublisher walletEvents;
	private final SecureRandom random = new SecureRandom();

	public WalletService(
			CustomerWalletRepository repository,
			KycStatusClient kycStatusClient,
			WalletEventPublisher walletEvents) {
		this.repository = repository;
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
					return disconnected;
				});
	}

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

		String seed = userId + ":" + (email == null ? "" : email) + ":" + HexFormat.of().formatHex(randomBytes(4));
		String digest = sha256(seed);
		String address = "0x" + digest.substring(0, 4) + "..." + digest.substring(digest.length() - 6);

		CustomerWallet wallet = existing.orElseGet(CustomerWallet::new);
		wallet.setUserId(userId);
		wallet.setUserEmail(email);
		wallet.setAddress(address);
		wallet.setStatus("connected");
		wallet.setProvider("secure_wallet");
		wallet.setMode("demo");
		wallet.setNote("Demo digital account for policy storage and payouts.");
		repository.save(wallet);
		walletEvents.walletLinked(userId, wallet);

		Map<String, Object> response = toResponse(wallet);
		response.put("ledger", "gcul");
		response.put("reused", false);
		return response;
	}

	private Map<String, Object> toResponse(CustomerWallet wallet) {
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("status", wallet.getStatus());
		result.put("address", wallet.getAddress());
		result.put("provider", wallet.getProvider() == null ? "secure_wallet" : wallet.getProvider());
		result.put("mode", wallet.getMode() == null ? "demo" : wallet.getMode());
		if (wallet.getNote() != null) {
			result.put("note", wallet.getNote());
		}
		return result;
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
