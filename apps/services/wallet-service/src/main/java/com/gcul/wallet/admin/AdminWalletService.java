package com.gcul.wallet.admin;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.gcul.wallet.model.CustomerWallet;
import com.gcul.wallet.model.PlatformWallet;
import com.gcul.wallet.model.WalletTransaction;
import com.gcul.wallet.repository.CustomerWalletRepository;
import com.gcul.wallet.repository.WalletTransactionRepository;
import com.gcul.wallet.service.ClaimsPoolService;

@Service
public class AdminWalletService {

	private final CustomerWalletRepository wallets;
	private final WalletTransactionRepository transactions;
	private final ClaimsPoolService claimsPool;

	public AdminWalletService(
			CustomerWalletRepository wallets,
			WalletTransactionRepository transactions,
			ClaimsPoolService claimsPool) {
		this.wallets = wallets;
		this.transactions = transactions;
		this.claimsPool = claimsPool;
	}

	public Map<String, Object> view() {
		List<CustomerWallet> walletRows = wallets.findAll().stream()
				.sorted(Comparator.comparing(CustomerWallet::getUpdatedAt,
						Comparator.nullsLast(Comparator.reverseOrder())))
				.toList();
		Map<String, CustomerWallet> walletByUser = walletRows.stream()
				.collect(Collectors.toMap(CustomerWallet::getUserId, w -> w, (a, b) -> a));

		List<WalletTransaction> txRows = transactions.findTop100ByOrderByCreatedAtDesc();

		double totalBalance = walletRows.stream()
				.filter(CustomerWallet::isConnected)
				.mapToDouble(CustomerWallet::getBalanceGbp)
				.sum();
		long connected = walletRows.stream().filter(CustomerWallet::isConnected).count();
		long disconnected = walletRows.size() - connected;

		double claimPayouts = sumByType(txRows, "claim_payout");
		double premiumVolume = Math.abs(sumByType(txRows, "premium"));
		double rechargeVolume = sumByType(txRows, "recharge");
		double poolTopUps = sumByType(txRows, "pool_top_up");
		double poolClaimDebits = Math.abs(sumByType(txRows, "pool_claim_debit"));
		double totalVolume = txRows.stream().mapToDouble(tx -> Math.abs(tx.getAmount())).sum();

		Map<String, Object> claimsPoolView = claimsPool.view();
		double poolBalance = ((Number) claimsPoolView.get("balance_gbp")).doubleValue();

		Map<String, Object> stats = new LinkedHashMap<>();
		stats.put("connected_wallets", connected);
		stats.put("disconnected_wallets", disconnected);
		stats.put("total_wallets", walletRows.size());
		stats.put("total_balance_gbp", roundMoney(totalBalance));
		stats.put("transaction_count", txRows.size());
		stats.put("total_volume_gbp", roundMoney(totalVolume));
		stats.put("claim_payouts_gbp", roundMoney(claimPayouts));
		stats.put("premium_volume_gbp", roundMoney(premiumVolume));
		stats.put("recharge_volume_gbp", roundMoney(rechargeVolume));
		stats.put("claims_pool_balance_gbp", roundMoney(poolBalance));
		stats.put("claims_pool_top_ups_gbp", roundMoney(poolTopUps));
		stats.put("claims_pool_debits_gbp", roundMoney(poolClaimDebits));

		List<Map<String, Object>> walletItems = walletRows.stream().map(this::toWalletRow).toList();
		List<Map<String, Object>> transactionItems = txRows.stream()
				.map(tx -> toTransactionRow(tx, walletByUser.get(tx.getUserId())))
				.toList();

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("stats", stats);
		response.put("claims_pool", claimsPoolView);
		response.put("wallets", walletItems);
		response.put("transactions", transactionItems);
		response.put("count", walletItems.size());
		response.put("transaction_count", transactionItems.size());
		response.put("generated_at", java.time.Instant.now().toString());
		return response;
	}

	private Map<String, Object> toWalletRow(CustomerWallet wallet) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("user_id", wallet.getUserId());
		row.put("email", wallet.getUserEmail());
		row.put("address", wallet.getAddress());
		row.put("status", wallet.getStatus());
		row.put("provider", wallet.getProvider());
		row.put("mode", wallet.getMode());
		row.put("balance_gbp", roundMoney(wallet.getBalanceGbp()));
		row.put("currency", wallet.getCurrency());
		row.put("updated_at", wallet.getUpdatedAt() == null ? null : wallet.getUpdatedAt().toString());
		return row;
	}

	private Map<String, Object> toTransactionRow(WalletTransaction tx, CustomerWallet wallet) {
		Map<String, Object> row = new LinkedHashMap<>();
		boolean poolTx = PlatformWallet.CLAIMS_POOL_ID.equals(tx.getUserId());
		row.put("id", tx.getId());
		row.put("user_id", tx.getUserId());
		row.put("customer_email", poolTx ? null : wallet == null ? null : wallet.getUserEmail());
		row.put("customer_name", poolTx ? "Claims reserve" : wallet == null ? null : displayName(wallet));
		row.put("wallet_address", poolTx ? PlatformWallet.CLAIMS_POOL_ID : wallet == null ? null : wallet.getAddress());
		row.put("type", tx.getType());
		row.put("amount", roundMoney(tx.getAmount()));
		row.put("currency", tx.getCurrency());
		row.put("status", tx.getStatus());
		row.put("reference", tx.getReference());
		row.put("method", methodForType(tx.getType(), wallet, tx));
		row.put("blockchain_tx", blockchainRef(tx));
		row.put("created_at", tx.getCreatedAt().toString());
		return row;
	}

	private static String displayName(CustomerWallet wallet) {
		if (wallet.getUserEmail() != null && !wallet.getUserEmail().isBlank()) {
			return wallet.getUserEmail().split("@")[0];
		}
		return wallet.getUserId();
	}

	private static String methodForType(String type, CustomerWallet wallet, WalletTransaction tx) {
		if ("pool_top_up".equals(type)) {
			String source = tx.getFundingSource();
			if (source != null && source.startsWith("vendor:")) {
				return "vendor contribution (" + source.substring("vendor:".length()) + ")";
			}
			return "insurer reserve top-up";
		}
		if ("pool_claim_debit".equals(type)) {
			return "claim settlement debit";
		}
		if ("claim_payout".equals(type)) {
			return "claim settlement";
		}
		if ("premium".equals(type)) {
			return "wallet debit";
		}
		if ("recharge".equals(type)) {
			return "demo top-up";
		}
		if (wallet != null && "linked".equals(wallet.getMode())) {
			return "canton linked";
		}
		return "demo ledger";
	}

	private static String blockchainRef(WalletTransaction tx) {
		if ("claim_payout".equals(tx.getType()) && tx.getReference() != null) {
			return tx.getReference();
		}
		if (tx.getReference() != null && !tx.getReference().isBlank()) {
			return tx.getReference();
		}
		return null;
	}

	private static double sumByType(List<WalletTransaction> rows, String type) {
		return rows.stream()
				.filter(tx -> type.equalsIgnoreCase(tx.getType()))
				.mapToDouble(WalletTransaction::getAmount)
				.sum();
	}

	private static double roundMoney(double value) {
		return Math.round(value * 100.0) / 100.0;
	}
}
