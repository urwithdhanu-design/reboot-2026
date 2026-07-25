package com.gcul.policy.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.gcul.policy.client.BlockchainMintClient;
import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.policy.PolicyRecordService;

@Service
public class AdminTokenizationService {

	private static final List<String> MINT_QUEUE_STATUSES = List.of("PENDING", "PENDING_WALLET", "FAILED");

	private final PolicyRecordService policyRecords;
	private final BlockchainMintClient blockchainClient;

	public AdminTokenizationService(PolicyRecordService policyRecords, BlockchainMintClient blockchainClient) {
		this.policyRecords = policyRecords;
		this.blockchainClient = blockchainClient;
	}

	public Map<String, Object> view() {
		List<PolicyRecord> minted = policyRecords.listMinted();
		List<PolicyRecord> queue = policyRecords.listMintQueue();
		Map<String, Object> blockchain = blockchainClient.fetchNftStatus();

		List<Map<String, Object>> registry = minted.stream()
				.map(this::toRegistryRow)
				.toList();
		List<Map<String, Object>> mintQueue = queue.stream()
				.map(this::toMintQueueRow)
				.toList();

		long mintedCount = minted.size();
		long pendingCount = policyRecords.countByMintStatus("PENDING");
		long pendingWalletCount = policyRecords.countByMintStatus("PENDING_WALLET");
		long failedCount = policyRecords.countByMintStatus("FAILED");

		Map<String, Object> stats = new LinkedHashMap<>();
		stats.put("policy_nfts", mintedCount);
		stats.put("pending_mints", pendingCount + pendingWalletCount);
		stats.put("pending_wallet", pendingWalletCount);
		stats.put("failed_mints", failedCount);
		stats.put("total_issued", mintedCount + queue.size());

		String contractAddress = str(blockchain.get("contractAddress"));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("registry", registry);
		response.put("mint_queue", mintQueue);
		response.put("stats", stats);
		response.put("blockchain", toBlockchainSummary(blockchain));
		response.put("standards", List.of(buildPolicyNftStandard(mintedCount, contractAddress)));
		response.put("count", registry.size());
		return response;
	}

	private Map<String, Object> toRegistryRow(PolicyRecord record) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("id", record.getPolicyId());
		row.put("token_id", record.getTokenId());
		row.put("name", record.getProductTitle());
		row.put("policy_number", record.getPolicyNumber());
		row.put("standard", "ERC-721");
		row.put("type", "policy_nft");
		row.put("owner", record.getCustomerEmail());
		row.put("status", registryStatus(record));
		row.put("contract_address", abbreviateAddress(record.getContractAddress()));
		row.put("transaction_hash", record.getTransactionHash());
		row.put("explorer_url", policyRecords.toResponse(record).get("explorer_url"));
		row.put("minted_at", record.getActivatedAt() == null
				? (record.getIssuedAt() == null ? null : record.getIssuedAt().toString())
				: record.getActivatedAt().toString());
		row.put("wallet_address", abbreviateAddress(record.getWalletAddress()));
		return row;
	}

	private Map<String, Object> toMintQueueRow(PolicyRecord record) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("id", record.getPolicyId());
		row.put("policy_number", record.getPolicyNumber());
		row.put("standard", "ERC-721");
		row.put("status", queueStatus(record.getMintStatus()));
		row.put("customer_name", record.getCustomerEmail());
		row.put("customer_email", record.getCustomerEmail());
		row.put("product_title", record.getProductTitle());
		row.put("requested_at", record.getIssuedAt() == null ? null : record.getIssuedAt().toString());
		return row;
	}

	private static String registryStatus(PolicyRecord record) {
		if ("FAILED".equalsIgnoreCase(record.getMintStatus())) {
			return "frozen";
		}
		if ("active".equalsIgnoreCase(record.getStatus()) || "MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return "active";
		}
		return "minting";
	}

	private static String queueStatus(String mintStatus) {
		if ("FAILED".equalsIgnoreCase(mintStatus)) {
			return "failed";
		}
		if ("PENDING_WALLET".equalsIgnoreCase(mintStatus)) {
			return "pending_wallet";
		}
		return "pending";
	}

	private static Map<String, Object> toBlockchainSummary(Map<String, Object> status) {
		Map<String, Object> summary = new LinkedHashMap<>();
		summary.put("network_name", str(status.getOrDefault("network", "Ethereum Sepolia")));
		summary.put("chain_id", status.getOrDefault("chainId", 11155111L));
		summary.put("mode", str(status.getOrDefault("mode", "simulated")));
		summary.put("live", Boolean.TRUE.equals(status.get("live")));
		summary.put("contract_address", str(status.get("contractAddress")));
		summary.put("enabled", Boolean.TRUE.equals(status.get("enabled")));
		return summary;
	}

	private static Map<String, Object> buildPolicyNftStandard(long supply, String contractAddress) {
		Map<String, Object> standard = new LinkedHashMap<>();
		standard.put("standard", "ERC-721");
		standard.put("symbol", "GCULPOL");
		standard.put("name", "Policy NFT");
		standard.put("description", "Unique insurance policy certificates minted to customer wallets on Sepolia.");
		standard.put("total_supply", supply);
		standard.put("circulating", supply);
		standard.put("enabled", true);
		standard.put("contract_address", contractAddress.isBlank() ? "Not deployed" : contractAddress);
		return standard;
	}

	private static String abbreviateAddress(String address) {
		if (!StringUtils.hasText(address)) {
			return "";
		}
		String trimmed = address.trim();
		if (trimmed.length() <= 12) {
			return trimmed;
		}
		return trimmed.substring(0, 6) + "…" + trimmed.substring(trimmed.length() - 4);
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
