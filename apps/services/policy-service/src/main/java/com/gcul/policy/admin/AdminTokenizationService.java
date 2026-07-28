package com.gcul.policy.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.gcul.policy.client.BlockchainMintClient;
import com.gcul.policy.messaging.PolicyIssuanceService;
import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.policy.PolicyRecordService;

@Service
public class AdminTokenizationService {

	private final PolicyRecordService policyRecords;
	private final BlockchainMintClient blockchainClient;
	private final PolicyIssuanceService policyIssuance;

	public AdminTokenizationService(
			PolicyRecordService policyRecords,
			BlockchainMintClient blockchainClient,
			PolicyIssuanceService policyIssuance) {
		this.policyRecords = policyRecords;
		this.blockchainClient = blockchainClient;
		this.policyIssuance = policyIssuance;
	}

	public Map<String, Object> view() {
		List<PolicyRecord> minted = policyRecords.listMinted();
		List<PolicyRecord> queue = policyRecords.listMintQueue();
		List<PolicyRecord> failed = policyRecords.listFailedMints();
		Map<String, Object> blockchain = blockchainClient.fetchNftStatus();

		List<Map<String, Object>> registry = minted.stream()
				.map(this::toRegistryRow)
				.toList();
		List<Map<String, Object>> mintQueue = queue.stream()
				.map(this::toMintQueueRow)
				.toList();
		List<Map<String, Object>> failedMints = failed.stream()
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
		stats.put("total_issued", mintedCount + queue.size() + failed.size());

		String contractAddress = str(blockchain.get("contractAddress"));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("registry", registry);
		response.put("mint_queue", mintQueue);
		response.put("failed_mints", failedMints);
		response.put("stats", stats);
		response.put("blockchain", toBlockchainSummary(blockchain));
		response.put("standards", List.of(buildPolicyNftStandard(mintedCount, contractAddress, str(blockchain.get("mode")))));
		response.put("count", registry.size());
		return response;
	}

	public Map<String, Object> approveMint(String policyId) {
		return policyIssuance.adminApproveMint(policyId);
	}

	public Map<String, Object> rejectMint(String policyId) {
		return policyIssuance.adminRejectMint(policyId);
	}

	private Map<String, Object> toRegistryRow(PolicyRecord record) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("id", record.getPolicyId());
		row.put("token_id", record.getTokenId());
		row.put("name", record.getProductTitle());
		row.put("policy_number", record.getPolicyNumber());
		row.put("standard", standardFor(record));
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
		row.put("product_category", record.getProductCategory());
		row.put("coverage_summary", record.getCoverageSummary());
		row.put("cover_expires_at", record.getCoverExpiresAt() == null ? null : record.getCoverExpiresAt().toString());
		row.put("coverage_limit_gbp", record.getCoverageLimitGbp());
		row.put("pre_mint_checks", preMintChecks(record));
		return row;
	}

	private Map<String, Object> toMintQueueRow(PolicyRecord record) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("id", record.getPolicyId());
		row.put("policy_number", record.getPolicyNumber());
		row.put("standard", standardFor(record));
		row.put("status", queueStatus(record.getMintStatus()));
		row.put("customer_name", record.getCustomerEmail());
		row.put("customer_email", record.getCustomerEmail());
		row.put("product_title", record.getProductTitle());
		row.put("requested_at", record.getIssuedAt() == null ? null : record.getIssuedAt().toString());
		row.put("product_category", record.getProductCategory());
		row.put("coverage_summary", record.getCoverageSummary());
		row.put("cover_expires_at", record.getCoverExpiresAt() == null ? null : record.getCoverExpiresAt().toString());
		row.put("coverage_limit_gbp", record.getCoverageLimitGbp());
		row.put("failure_reason", record.getMintFailureReason());
		row.put("failed_at", record.getMintFailedAt() == null ? null : record.getMintFailedAt().toString());
		row.put("next_action", nextAction(record));
		return row;
	}

	private static List<Map<String, Object>> preMintChecks(PolicyRecord record) {
		return List.of(
				check("Policy issued", "passed", "Policy issuance record is active."),
				check("Wallet linked", StringUtils.hasText(record.getWalletAddress()) ? "passed" : "failed",
						StringUtils.hasText(record.getWalletAddress()) ? "Customer wallet was present for the mint." : "No customer wallet was recorded."),
				check("Policy reference hash", StringUtils.hasText(record.getPolicyReferenceHash()) ? "passed" : "failed",
						StringUtils.hasText(record.getPolicyReferenceHash()) ? "Immutable policy reference hash was supplied." : "Policy reference hash is missing."),
				check("Compliance decision", "APPROVED".equalsIgnoreCase(record.getComplianceDecision()) ? "passed" : "review",
						StringUtils.hasText(record.getComplianceDecision()) ? record.getComplianceDecision() : "No compliance decision was recorded."),
				check("Fraud screening", record.getComplianceFraudScore() == null || record.getComplianceFraudScore() < 0.80 ? "passed" : "failed",
						record.getComplianceFraudScore() == null ? "No score recorded." : "Risk score " + String.format(java.util.Locale.ROOT, "%.2f", record.getComplianceFraudScore())));
	}

	private static Map<String, Object> check(String name, String status, String detail) {
		Map<String, Object> check = new LinkedHashMap<>();
		check.put("name", name);
		check.put("status", status);
		check.put("detail", detail);
		return check;
	}

	private static String nextAction(PolicyRecord record) {
		String reason = str(record.getMintFailureReason()).toLowerCase();
		if (reason.contains("wallet")) return "Ask the customer to link a valid wallet, then retry the mint.";
		if (reason.contains("compliance") || reason.contains("rejected")) return "Review the compliance decision and resolve the rejection before retrying.";
		return "Check Canton and the blockchain orchestrator, then retry the mint.";
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
		String mode = str(status.getOrDefault("mode", "simulated"));
		String network = str(status.getOrDefault("network", "Canton Local Sandbox"));
		summary.put("network_name", network);
		summary.put("chain_id", status.getOrDefault("chainId", 0L));
		summary.put("mode", mode);
		summary.put("live", Boolean.TRUE.equals(status.get("live")));
		summary.put("contract_address", str(status.get("contractAddress")));
		summary.put("enabled", Boolean.TRUE.equals(status.get("enabled")));
		summary.put("ledger_type", mode.contains("canton") ? "canton" : "simulated");
		return summary;
	}

	private static Map<String, Object> buildPolicyNftStandard(long supply, String contractAddress, String mode) {
		boolean canton = true;
		Map<String, Object> standard = new LinkedHashMap<>();
		standard.put("standard", "Daml/Canton");
		standard.put("symbol", "GCULPOL-C");
		standard.put("name", "Policy Certificate (Canton)");
		standard.put("description", "Insurance policy certificates minted on the Canton local sandbox by the insurer.");
		standard.put("total_supply", supply);
		standard.put("circulating", supply);
		standard.put("enabled", true);
		standard.put("contract_address", contractAddress.isBlank() ? "Not deployed" : contractAddress);
		return standard;
	}

	private static String standardFor(PolicyRecord record) {
		String network = record.getBlockchainNetwork() == null ? "" : record.getBlockchainNetwork().toLowerCase();
		return network.contains("canton") ? "Daml/Canton" : "ERC-721";
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
