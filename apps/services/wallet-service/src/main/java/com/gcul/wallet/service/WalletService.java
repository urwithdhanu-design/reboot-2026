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
	private final WalletConsentService consentService;
	private final SecureRandom random = new SecureRandom();

	public WalletService(
			CustomerWalletRepository repository,
			WalletTransactionRepository transactions,
			KycStatusClient kycStatusClient,
			WalletEventPublisher walletEvents,
			WalletConsentService consentService) {
		this.repository = repository;
		this.transactions = transactions;
		this.kycStatusClient = kycStatusClient;
		this.walletEvents = walletEvents;
		this.consentService = consentService;
	}

	public Map<String, Object> getWallet(String userId) {
		return repository.findByUserId(userId)
				.map(this::toResponse)
				.orElseGet(this::disconnectedWallet);
	}

	public Map<String, Object> getWalletWithUser(String userId) {
		return repository.findByUserId(userId)
				.map(wallet -> {
					Map<String, Object> response = toResponse(wallet);
					response.put("userId", wallet.getUserId());
					response.put("email", wallet.getUserEmail());
					return response;
				})
				.orElseGet(this::disconnectedWallet);
	}

	public Map<String, Object> getWalletByEmail(String email) {
		return repository.findByUserEmailIgnoreCase(email)
				.map(wallet -> {
					Map<String, Object> response = toResponse(wallet);
					response.put("userId", wallet.getUserId());
					response.put("email", wallet.getUserEmail());
					return response;
				})
				.orElseGet(this::disconnectedWallet);
	}

	@Transactional
	public Map<String, Object> linkWallet(String userId, String email, String address, String bearerToken) {
		if (!isValidEthereumAddress(address)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Ethereum wallet address");
		}
		if (!"verified".equals(kycStatusClient.fetchKycStatus(bearerToken))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Complete KYC verification before linking a wallet");
		}

		CustomerWallet wallet = repository.findByUserId(userId).orElseGet(CustomerWallet::new);
		wallet.setUserId(userId);
		wallet.setUserEmail(email);
		wallet.setAddress(address.trim().toLowerCase());
		wallet.setStatus(WalletConsentService.STATUS_PENDING);
		wallet.setProvider("ethereum");
		wallet.setMode("linked");
		wallet.setNote("Pending email approval — verify to enable policy NFT delivery and payouts.");
		wallet.setCurrency("GBP");
		if (wallet.getBalanceGbp() < 0) {
			wallet.setBalanceGbp(0.0);
		}
		wallet.setUpdatedAt(Instant.now());
		wallet = repository.saveAndFlush(wallet);

		Map<String, Object> response = toResponse(wallet);
		response.putAll(consentService.issueConsentEmail(wallet, email));
		response.put("linked", false);
		return response;
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
		if (existing.isPresent() && existing.get().isPendingConsent()) {
			CustomerWallet pending = existing.get();
			pending.setUserEmail(email);
			pending.setUpdatedAt(Instant.now());
			pending = repository.saveAndFlush(pending);
			Map<String, Object> map = toResponse(pending);
			map.putAll(consentService.issueConsentEmail(pending, email));
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
		wallet.setStatus(WalletConsentService.STATUS_PENDING);
		wallet.setProvider("secure_wallet");
		wallet.setMode("demo");
		wallet.setNote("Pending email approval — check your inbox to activate your demo wallet.");
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
				wallet.setStatus(WalletConsentService.STATUS_PENDING);
				wallet.setProvider("secure_wallet");
				wallet.setMode("demo");
				wallet.setNote("Pending email approval — check your inbox to activate your demo wallet.");
				wallet.setCurrency("GBP");
				wallet.setUpdatedAt(Instant.now());
				wallet = repository.saveAndFlush(wallet);
			}
		}

		Map<String, Object> response = toResponse(wallet);
		response.putAll(consentService.issueConsentEmail(wallet, email));
		response.put("ledger", "gcul");
		response.put("reused", existing.isPresent());
		return response;
	}

	@Transactional
	public Map<String, Object> rechargeWallet(String userId, double amount, String bankAccount) {
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recharge amount must be greater than zero");
		}
		if (amount > MAX_RECHARGE) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Recharge amount cannot exceed £" + (int) MAX_RECHARGE);
		}

		String fundingSource = normalizeBankAccount(bankAccount);

		CustomerWallet wallet = repository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Create a wallet before recharging"));
		if (!wallet.isConnected()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Wallet not active — approve the email link or create a wallet before recharging");
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
		tx.setFundingSource(fundingSource);
		tx.setCreatedAt(Instant.now());
		tx = transactions.saveAndFlush(tx);

		walletEvents.walletRecharged(userId, wallet, tx);

		Map<String, Object> response = toResponse(wallet);
		response.put("transaction", toTransactionResponse(tx));
		return response;
	}

	@Transactional
	public Map<String, Object> creditClaimPayout(
			String userId,
			String email,
			String walletAddress,
			String claimId,
			double amount) {
		if (claimId == null || claimId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "claim_id is required");
		}
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payout amount must be greater than zero");
		}

		var existing = transactions.findByReferenceAndType(claimId, "claim_payout");
		if (existing.isPresent()) {
			CustomerWallet wallet = resolveWallet(userId, email, walletAddress);
			Map<String, Object> response = toResponse(wallet);
			response.put("transaction", toTransactionResponse(existing.get()));
			response.put("reused", true);
			return response;
		}

		CustomerWallet wallet = resolveWallet(userId, email, walletAddress);
		if (!wallet.isConnected()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Customer wallet not active — approve the email link before claim payout");
		}

		double credit = roundMoney(amount);
		wallet.setBalanceGbp(roundMoney(wallet.getBalanceGbp() + credit));
		wallet.setUpdatedAt(Instant.now());
		wallet = repository.saveAndFlush(wallet);

		WalletTransaction tx = new WalletTransaction();
		tx.setId("CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		tx.setUserId(wallet.getUserId());
		tx.setType("claim_payout");
		tx.setAmount(credit);
		tx.setCurrency(wallet.getCurrency() == null ? "GBP" : wallet.getCurrency());
		tx.setStatus("completed");
		tx.setReference(claimId);
		tx.setCreatedAt(Instant.now());
		tx = transactions.saveAndFlush(tx);

		walletEvents.walletClaimPaid(wallet.getUserId(), wallet, tx, claimId);

		Map<String, Object> response = toResponse(wallet);
		response.put("transaction", toTransactionResponse(tx));
		response.put("reused", false);
		return response;
	}

	public Map<String, Object> getWalletByAddress(String address) {
		return repository.findByAddressIgnoreCase(normalizeAddress(address))
				.map(this::toResponse)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wallet not found for address"));
	}

	private CustomerWallet resolveWallet(String userId, String email, String walletAddress) {
		if (isKnown(walletAddress)) {
			var byAddress = repository.findByAddressIgnoreCase(normalizeAddress(walletAddress));
			if (byAddress.isPresent()) {
				return byAddress.get();
			}
		}

		if (isKnown(userId)) {
			var byId = repository.findByUserId(userId.trim());
			if (byId.isPresent()) {
				return byId.get();
			}
		}

		if (isKnown(email)) {
			var byEmail = repository.findByUserEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT));
			if (byEmail.isPresent()) {
				return byEmail.get();
			}
		}

		if (isKnown(userId) && userId.contains("@")) {
			var byEmail = repository.findByUserEmailIgnoreCase(userId.trim().toLowerCase(Locale.ROOT));
			if (byEmail.isPresent()) {
				return byEmail.get();
			}
		}

		if (isKnown(walletAddress)) {
			return provisionWalletForClaimPayout(walletAddress, userId, email);
		}

		throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
				"Wallet not found for customer — link a wallet or ensure policy wallet_address is set");
	}

	private CustomerWallet provisionWalletForClaimPayout(String walletAddress, String userId, String email) {
		String normalizedAddress = normalizeAddress(walletAddress);
		CustomerWallet wallet = new CustomerWallet();
		wallet.setUserId(isKnown(userId) ? userId.trim() : isKnown(email)
				? email.trim().toLowerCase(Locale.ROOT)
				: "wallet:" + normalizedAddress.substring(2, 12));
		if (isKnown(email)) {
			wallet.setUserEmail(email.trim().toLowerCase(Locale.ROOT));
		}
		wallet.setAddress(normalizedAddress);
		wallet.setStatus("connected");
		wallet.setProvider("secure_wallet");
		wallet.setMode("demo");
		wallet.setNote("Auto-provisioned for parametric claim payout");
		wallet.setCurrency("GBP");
		wallet.setBalanceGbp(0.0);
		wallet.setUpdatedAt(Instant.now());
		wallet = repository.saveAndFlush(wallet);
		walletEvents.walletLinked(wallet.getUserId(), wallet);
		return wallet;
	}

	private static boolean isKnown(String value) {
		if (value == null || value.isBlank()) {
			return false;
		}
		String normalized = value.trim().toLowerCase(Locale.ROOT);
		return !normalized.equals("unknown") && !normalized.equals("n/a") && !normalized.equals("-");
	}

	private static String normalizeAddress(String address) {
		return address == null ? "" : address.trim().toLowerCase(Locale.ROOT);
	}

	private CustomerWallet resolveWallet(String userId, String email) {
		return resolveWallet(userId, email, null);
	}

	@Transactional
	public Map<String, Object> payForPremium(String userId, String quoteId, double amount) {
		if (quoteId == null || quoteId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quote_id is required");
		}
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount must be greater than zero");
		}

		var existing = transactions.findByReferenceAndType(quoteId, "premium");
		if (existing.isPresent()) {
			CustomerWallet wallet = repository.findByUserId(userId)
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wallet not found"));
			Map<String, Object> response = toResponse(wallet);
			response.put("transaction", toTransactionResponse(existing.get()));
			response.put("reused", true);
			return response;
		}

		CustomerWallet wallet = repository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Create a wallet before paying"));
		if (!wallet.isConnected()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Wallet not active — approve the email link before paying");
		}

		double charge = roundMoney(amount);
		if (wallet.getBalanceGbp() + 0.001 < charge) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Insufficient wallet balance. Recharge your wallet and try again.");
		}

		wallet.setBalanceGbp(roundMoney(wallet.getBalanceGbp() - charge));
		wallet.setUpdatedAt(Instant.now());
		wallet = repository.saveAndFlush(wallet);

		WalletTransaction tx = new WalletTransaction();
		tx.setId("PRM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		tx.setUserId(userId);
		tx.setType("premium");
		tx.setAmount(-charge);
		tx.setCurrency(wallet.getCurrency() == null ? "GBP" : wallet.getCurrency());
		tx.setStatus("completed");
		tx.setReference(quoteId);
		tx.setCreatedAt(Instant.now());
		tx = transactions.saveAndFlush(tx);

		walletEvents.walletPremiumPaid(userId, wallet, tx, quoteId);

		Map<String, Object> response = toResponse(wallet);
		response.put("transaction", toTransactionResponse(tx));
		response.put("reused", false);
		return response;
	}

	private String generateAddress(String userId, String email) {
		String seed = userId + ":" + (email == null ? "" : email) + ":" + HexFormat.of().formatHex(randomBytes(16));
		String digest = sha256(seed);
		return "0x" + digest.substring(0, 40);
	}

	private Map<String, Object> disconnectedWallet() {
		Map<String, Object> disconnected = new LinkedHashMap<>();
		disconnected.put("status", "disconnected");
		disconnected.put("address", null);
		disconnected.put("balance_gbp", 0.0);
		disconnected.put("currency", "GBP");
		return disconnected;
	}

	private static boolean isValidEthereumAddress(String address) {
		return address != null && address.matches("^0x[0-9a-fA-F]{40}$");
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
		result.put("funding_source", tx.getFundingSource());
		result.put("created_at", tx.getCreatedAt().toString());
		return result;
	}

	private String normalizeBankAccount(String bankAccount) {
		if (bankAccount == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a bank account for this demo top-up");
		}
		return switch (bankAccount) {
			case "Lloyds Bank", "Barclays", "HSBC" -> bankAccount;
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Select a supported bank account for this demo top-up");
		};
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
