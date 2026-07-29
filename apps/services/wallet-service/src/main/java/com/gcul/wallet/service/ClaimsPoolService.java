package com.gcul.wallet.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.wallet.model.PlatformWallet;
import com.gcul.wallet.model.WalletTransaction;
import com.gcul.wallet.repository.PlatformWalletRepository;
import com.gcul.wallet.repository.WalletTransactionRepository;

@Service
public class ClaimsPoolService {

	private static final double DEFAULT_SEED_BALANCE = 100_000.0;

	private final PlatformWalletRepository pools;
	private final WalletTransactionRepository transactions;

	public ClaimsPoolService(PlatformWalletRepository pools, WalletTransactionRepository transactions) {
		this.pools = pools;
		this.transactions = transactions;
	}

	@Transactional
	public PlatformWallet ensureClaimsPool() {
		return pools.findById(PlatformWallet.CLAIMS_POOL_ID).orElseGet(() -> {
			PlatformWallet pool = new PlatformWallet();
			pool.setId(PlatformWallet.CLAIMS_POOL_ID);
			pool.setLabel("Insurer claims reserve");
			pool.setBalanceGbp(DEFAULT_SEED_BALANCE);
			pool.setCurrency("GBP");
			pool.setUpdatedAt(Instant.now());
			return pools.saveAndFlush(pool);
		});
	}

	@Transactional(readOnly = true)
	public Map<String, Object> view() {
		PlatformWallet pool = ensureClaimsPool();
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", pool.getId());
		map.put("label", pool.getLabel());
		map.put("balance_gbp", roundMoney(pool.getBalanceGbp()));
		map.put("currency", pool.getCurrency());
		map.put("updated_at", pool.getUpdatedAt() == null ? null : pool.getUpdatedAt().toString());
		return map;
	}

	@Transactional
	public Map<String, Object> topUp(double amount, String reference, String source) {
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Top-up amount must be greater than zero");
		}
		PlatformWallet pool = ensureClaimsPool();
		double credit = roundMoney(amount);
		pool.setBalanceGbp(roundMoney(pool.getBalanceGbp() + credit));
		pool.setUpdatedAt(Instant.now());
		pool = pools.saveAndFlush(pool);

		WalletTransaction tx = new WalletTransaction();
		tx.setId("POOL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		tx.setUserId(PlatformWallet.CLAIMS_POOL_ID);
		tx.setType("pool_top_up");
		tx.setAmount(credit);
		tx.setCurrency(pool.getCurrency());
		tx.setStatus("completed");
		tx.setReference(reference == null || reference.isBlank() ? "admin-top-up" : reference.trim());
		tx.setFundingSource(source == null || source.isBlank() ? "admin" : source.trim());
		tx.setCreatedAt(Instant.now());
		transactions.saveAndFlush(tx);

		Map<String, Object> response = view();
		response.put("transaction", toTransactionMap(tx));
		return response;
	}

	@Transactional
	public void debitForClaim(double amount, String claimId) {
		if (claimId == null || claimId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "claim_id is required");
		}
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payout amount must be greater than zero");
		}

		var existing = transactions.findByReferenceAndType(claimId, "pool_claim_debit");
		if (existing.isPresent()) {
			return;
		}

		PlatformWallet pool = ensureClaimsPool();
		double debit = roundMoney(amount);
		if (pool.getBalanceGbp() + 0.001 < debit) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Insufficient claims pool balance. Top up the insurer reserve before settling claims.");
		}

		pool.setBalanceGbp(roundMoney(pool.getBalanceGbp() - debit));
		pool.setUpdatedAt(Instant.now());
		pools.saveAndFlush(pool);

		WalletTransaction tx = new WalletTransaction();
		tx.setId("PLD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		tx.setUserId(PlatformWallet.CLAIMS_POOL_ID);
		tx.setType("pool_claim_debit");
		tx.setAmount(-debit);
		tx.setCurrency(pool.getCurrency());
		tx.setStatus("completed");
		tx.setReference(claimId);
		tx.setFundingSource("claim_settlement");
		tx.setCreatedAt(Instant.now());
		transactions.saveAndFlush(tx);
	}

	private static Map<String, Object> toTransactionMap(WalletTransaction tx) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", tx.getId());
		map.put("type", tx.getType());
		map.put("amount", roundMoney(tx.getAmount()));
		map.put("currency", tx.getCurrency());
		map.put("reference", tx.getReference());
		map.put("created_at", tx.getCreatedAt().toString());
		return map;
	}

	private static double roundMoney(double value) {
		return Math.round(value * 100.0) / 100.0;
	}
}
