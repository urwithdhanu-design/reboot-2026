package com.gcul.policy.policy;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.repository.PolicyRecordRepository;

@Service
public class PolicyRecordService {

	private final PolicyRecordRepository repository;

	public PolicyRecordService(PolicyRecordRepository repository) {
		this.repository = repository;
	}

	@Transactional
	public PolicyRecord createIssuedPolicy(
			String policyId,
			String policyNumber,
			String quoteId,
			String customerId,
			String customerEmail,
			String productTitle,
			String walletAddress,
			String policyReferenceHash,
			String metadataUri) {
		if (repository.findByQuoteId(quoteId).isPresent()) {
			return repository.findByQuoteId(quoteId).orElseThrow();
		}
		PolicyRecord record = new PolicyRecord();
		record.setPolicyId(policyId);
		record.setPolicyNumber(policyNumber);
		record.setQuoteId(quoteId);
		record.setCustomerId(customerId);
		record.setCustomerEmail(customerEmail);
		record.setProductTitle(productTitle);
		record.setWalletAddress(walletAddress);
		record.setPolicyReferenceHash(policyReferenceHash);
		record.setMetadataUri(metadataUri);
		record.setStatus("issued");
		record.setMintStatus(walletAddress == null || walletAddress.isBlank() ? "PENDING_WALLET" : "PENDING");
		record.setIssuedAt(Instant.now());
		return repository.save(record);
	}

	@Transactional
	public PolicyRecord applyMintResult(String policyId, Map<String, Object> mintResult) {
		PolicyRecord record = repository.findById(policyId).orElseThrow();
		record.setTokenId(str(mintResult.get("tokenId")));
		record.setTransactionHash(str(mintResult.get("transactionHash")));
		record.setContractAddress(str(mintResult.get("contractAddress")));
		record.setBlockchainNetwork(str(mintResult.get("network")));
		record.setMintStatus(str(mintResult.getOrDefault("mintStatus", "MINTED")));
		Object blockNumber = mintResult.get("blockNumber");
		if (blockNumber instanceof Number number) {
			record.setBlockNumber(number.longValue());
		}
		record.setStatus("active");
		record.setActivatedAt(Instant.now());
		return repository.save(record);
	}

	@Transactional
	public PolicyRecord resetMintForRetry(String policyId) {
		PolicyRecord record = repository.findById(policyId).orElseThrow();
		if ("MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return record;
		}
		record.setMintStatus("PENDING");
		record.setStatus("issued");
		return repository.save(record);
	}

	@Transactional
	public PolicyRecord markMintFailed(String policyId, String reason) {
		PolicyRecord record = repository.findById(policyId).orElseThrow();
		record.setMintStatus("FAILED");
		record.setStatus("mint_failed");
		return repository.save(record);
	}

	@Transactional
	public PolicyRecord attachWallet(String policyId, String walletAddress) {
		PolicyRecord record = repository.findById(policyId).orElseThrow();
		record.setWalletAddress(walletAddress);
		if ("PENDING_WALLET".equals(record.getMintStatus())) {
			record.setMintStatus("PENDING");
		}
		return repository.save(record);
	}

	public Optional<PolicyRecord> findByPolicyId(String policyId) {
		return repository.findById(policyId);
	}

	public Optional<PolicyRecord> findByQuoteId(String quoteId) {
		return repository.findByQuoteId(quoteId);
	}

	public List<PolicyRecord> listForCustomer(String customerId, String email, String walletAddress) {
		java.util.LinkedHashMap<String, PolicyRecord> merged = new java.util.LinkedHashMap<>();

		if (isKnown(customerId)) {
			for (PolicyRecord record : repository.findByCustomerIdOrderByIssuedAtDesc(customerId.trim())) {
				merged.put(record.getPolicyId(), record);
			}
		}

		if (isKnown(email)) {
			String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
			for (PolicyRecord record : repository.findByCustomerEmailOrderByIssuedAtDesc(normalizedEmail)) {
				merged.put(record.getPolicyId(), record);
			}
		}

		if (isKnown(walletAddress)) {
			for (PolicyRecord record : repository.findByWalletAddressIgnoreCaseOrderByIssuedAtDesc(
					walletAddress.trim().toLowerCase(java.util.Locale.ROOT))) {
				merged.put(record.getPolicyId(), record);
			}
		}

		return merged.values().stream()
				.sorted(java.util.Comparator.comparing(
						PolicyRecord::getIssuedAt,
						java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
				.toList();
	}

	private static boolean isKnown(String value) {
		if (value == null || value.isBlank()) {
			return false;
		}
		String normalized = value.trim().toLowerCase(java.util.Locale.ROOT);
		return !normalized.equals("unknown") && !normalized.equals("n/a") && !normalized.equals("-");
	}

	public List<PolicyRecord> listPendingMint() {
		return repository.findByMintStatusOrderByIssuedAtAsc("PENDING");
	}

	public List<PolicyRecord> listMintQueue() {
		return repository.findByMintStatusInOrderByIssuedAtAsc(
				java.util.List.of("PENDING", "PENDING_WALLET", "FAILED"));
	}

	public List<PolicyRecord> listMinted() {
		return repository.findByMintStatusOrderByIssuedAtDesc("MINTED");
	}

	public List<PolicyRecord> listAllIssued() {
		return repository.findAllByOrderByIssuedAtDesc();
	}

	public long countByMintStatus(String mintStatus) {
		return repository.countByMintStatus(mintStatus);
	}

	public Map<String, Object> toResponse(PolicyRecord record) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("policy_id", record.getPolicyId());
		map.put("policy_number", record.getPolicyNumber());
		map.put("quote_id", record.getQuoteId());
		map.put("customer_id", record.getCustomerId());
		map.put("customer_email", record.getCustomerEmail());
		map.put("product_title", record.getProductTitle());
		map.put("status", record.getStatus());
		map.put("wallet_address", record.getWalletAddress());
		map.put("policy_reference_hash", record.getPolicyReferenceHash());
		map.put("metadata_uri", record.getMetadataUri());
		map.put("token_id", record.getTokenId());
		map.put("transaction_hash", record.getTransactionHash());
		map.put("contract_address", record.getContractAddress());
		map.put("block_number", record.getBlockNumber());
		map.put("blockchain_network", record.getBlockchainNetwork());
		map.put("mint_status", record.getMintStatus());
		map.put("payment_status", "paid");
		map.put("issued_at", record.getIssuedAt() == null ? null : record.getIssuedAt().toString());
		map.put("activated_at", record.getActivatedAt() == null ? null : record.getActivatedAt().toString());
		map.put("explorer_url", buildExplorerUrl(record));
		map.put("ledger_type", ledgerType(record));
		return map;
	}

	private static String ledgerType(PolicyRecord record) {
		String network = record.getBlockchainNetwork() == null ? "" : record.getBlockchainNetwork().toLowerCase();
		if (network.contains("canton")) {
			return "canton";
		}
		if (record.getTransactionHash() != null && record.getTransactionHash().startsWith("0xsim")) {
			return "simulated";
		}
		return "ethereum";
	}

	private static String buildExplorerUrl(PolicyRecord record) {
		if (record.getTransactionHash() == null || record.getTransactionHash().isBlank()) {
			return null;
		}
		if (record.getTransactionHash().startsWith("0xsim")) {
			return null;
		}
		String network = record.getBlockchainNetwork() == null ? "" : record.getBlockchainNetwork().toLowerCase();
		if (network.contains("canton")) {
			return null;
		}
		return "https://sepolia.etherscan.io/tx/" + record.getTransactionHash();
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
