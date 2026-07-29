package com.gcul.wallet.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
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
public class VendorReserveService {

	private static final double DEFAULT_VENDOR_SEED = 50_000.0;

	private final PlatformWalletRepository pools;
	private final WalletTransactionRepository transactions;
	private final ClaimsPoolService claimsPool;

	public VendorReserveService(
			PlatformWalletRepository pools,
			WalletTransactionRepository transactions,
			ClaimsPoolService claimsPool) {
		this.pools = pools;
		this.transactions = transactions;
		this.claimsPool = claimsPool;
	}

	public static String vendorWalletId(String vendorCode) {
		String normalized = vendorCode == null ? "" : vendorCode.trim().toLowerCase(Locale.ROOT);
		if (normalized.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "vendor_code is required");
		}
		return "vendor-" + normalized;
	}

	@Transactional
	public PlatformWallet ensureVendorReserve(String vendorCode, String vendorName) {
		String walletId = vendorWalletId(vendorCode);
		return pools.findById(walletId).orElseGet(() -> {
			PlatformWallet wallet = new PlatformWallet();
			wallet.setId(walletId);
			wallet.setLabel(vendorName == null || vendorName.isBlank()
					? "Vendor reserve (" + vendorCode + ")"
					: vendorName + " reserve");
			wallet.setBalanceGbp(DEFAULT_VENDOR_SEED);
			wallet.setCurrency("GBP");
			wallet.setUpdatedAt(Instant.now());
			return pools.saveAndFlush(wallet);
		});
	}

	@Transactional(readOnly = true)
	public Map<String, Object> view(String vendorCode, String vendorName) {
		PlatformWallet vendor = ensureVendorReserve(vendorCode, vendorName);
		String walletId = vendor.getId();

		Map<String, Object> vendorView = new LinkedHashMap<>();
		vendorView.put("id", walletId);
		vendorView.put("vendor_code", vendorCode.trim().toLowerCase(Locale.ROOT));
		vendorView.put("label", vendor.getLabel());
		vendorView.put("balance_gbp", roundMoney(vendor.getBalanceGbp()));
		vendorView.put("currency", vendor.getCurrency());
		vendorView.put("updated_at", vendor.getUpdatedAt() == null ? null : vendor.getUpdatedAt().toString());

		List<Map<String, Object>> txRows = transactions.findByUserId(walletId).stream()
				.filter(tx -> "vendor_contribution".equals(tx.getType()) || "vendor_premium".equals(tx.getType()))
				.sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
				.limit(20)
				.map(this::toVendorTransactionRow)
				.toList();

		double contributed = transactions.findByUserIdAndType(walletId, "vendor_contribution").stream()
				.mapToDouble(tx -> Math.abs(tx.getAmount()))
				.sum();
		double premiums = transactions.findByUserIdAndType(walletId, "vendor_premium").stream()
				.mapToDouble(tx -> Math.abs(tx.getAmount()))
				.sum();

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("vendor_reserve", vendorView);
		response.put("claims_pool", claimsPool.view());
		response.put("premiums_total_gbp", roundMoney(premiums));
		response.put("contributions_total_gbp", roundMoney(contributed));
		response.put("transactions", txRows);
		return response;
	}

	@Transactional
	public Map<String, Object> creditPremium(
			String vendorCode,
			String vendorName,
			double amount,
			String quoteId,
			String customerId) {
		if (quoteId == null || quoteId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quote_id is required");
		}
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Premium amount must be greater than zero");
		}

		String walletId = vendorWalletId(vendorCode);
		var existing = transactions.findByReferenceAndType(quoteId, "vendor_premium");
		if (existing.isPresent() && walletId.equals(existing.get().getUserId())) {
			Map<String, Object> response = view(vendorCode, vendorName);
			response.put("transaction", toVendorTransactionRow(existing.get()));
			response.put("reused", true);
			return response;
		}

		PlatformWallet vendor = ensureVendorReserve(vendorCode, vendorName);
		double credit = roundMoney(amount);
		vendor.setBalanceGbp(roundMoney(vendor.getBalanceGbp() + credit));
		vendor.setUpdatedAt(Instant.now());
		pools.saveAndFlush(vendor);

		WalletTransaction tx = new WalletTransaction();
		tx.setId("VPR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		tx.setUserId(walletId);
		tx.setType("vendor_premium");
		tx.setAmount(credit);
		tx.setCurrency(vendor.getCurrency());
		tx.setStatus("completed");
		tx.setReference(quoteId);
		tx.setFundingSource(customerId == null || customerId.isBlank() ? "customer_premium" : customerId.trim());
		tx.setCreatedAt(Instant.now());
		transactions.saveAndFlush(tx);

		Map<String, Object> response = view(vendorCode, vendorName);
		response.put("transaction", toVendorTransactionRow(tx));
		response.put("reused", false);
		return response;
	}

	@Transactional
	public Map<String, Object> contribute(String vendorCode, String vendorName, double amount, String reference) {
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contribution amount must be greater than zero");
		}

		PlatformWallet vendor = ensureVendorReserve(vendorCode, vendorName);
		double debit = roundMoney(amount);
		if (vendor.getBalanceGbp() + 0.001 < debit) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Insufficient vendor reserve balance. Demo top-up is not available — fund your reserve from platform admin or reduce the transfer amount.");
		}

		String transferRef = reference == null || reference.isBlank()
				? "VND-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT)
				: reference.trim();
		String vendorCodeNorm = vendorCode.trim().toLowerCase(Locale.ROOT);

		vendor.setBalanceGbp(roundMoney(vendor.getBalanceGbp() - debit));
		vendor.setUpdatedAt(Instant.now());
		pools.saveAndFlush(vendor);

		WalletTransaction vendorTx = new WalletTransaction();
		vendorTx.setId("VCT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		vendorTx.setUserId(vendor.getId());
		vendorTx.setType("vendor_contribution");
		vendorTx.setAmount(-debit);
		vendorTx.setCurrency(vendor.getCurrency());
		vendorTx.setStatus("completed");
		vendorTx.setReference(transferRef);
		vendorTx.setFundingSource(PlatformWallet.CLAIMS_POOL_ID);
		vendorTx.setCreatedAt(Instant.now());
		transactions.saveAndFlush(vendorTx);

		Map<String, Object> poolResult = claimsPool.topUp(debit, transferRef, "vendor:" + vendorCodeNorm);

		Map<String, Object> response = view(vendorCode, vendorName);
		response.put("contribution", Map.of(
				"amount_gbp", debit,
				"reference", transferRef,
				"vendor_code", vendorCodeNorm,
				"pool_transaction", poolResult.get("transaction")));
		return response;
	}

	private Map<String, Object> toVendorTransactionRow(WalletTransaction tx) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("id", tx.getId());
		row.put("type", tx.getType());
		row.put("amount", roundMoney(tx.getAmount()));
		row.put("currency", tx.getCurrency());
		row.put("status", tx.getStatus());
		row.put("reference", tx.getReference());
		row.put("destination", tx.getFundingSource());
		row.put("created_at", tx.getCreatedAt().toString());
		row.put("label", labelForType(tx.getType(), tx.getAmount()));
		return row;
	}

	private static String labelForType(String type, double amount) {
		if ("vendor_contribution".equals(type)) {
			return "Transfer to insurer claims pool";
		}
		if ("vendor_premium".equals(type)) {
			return "Customer premium received";
		}
		if ("vendor_reserve_top_up".equals(type)) {
			return "Reserve funding";
		}
		return type;
	}

	private static double roundMoney(double value) {
		return Math.round(value * 100.0) / 100.0;
	}
}
