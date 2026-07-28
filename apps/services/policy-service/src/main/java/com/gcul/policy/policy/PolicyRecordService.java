package com.gcul.policy.policy;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.motor.MotorCoverageLimits;
import com.gcul.policy.quote.QuoteService;
import com.gcul.policy.repository.PolicyRecordRepository;

@Service
public class PolicyRecordService {

	private final PolicyRecordRepository repository;
	private final PolicyCoverageResolver coverageResolver;
	private final QuoteService quoteService;

	public PolicyRecordService(
			PolicyRecordRepository repository,
			PolicyCoverageResolver coverageResolver,
			QuoteService quoteService) {
		this.repository = repository;
		this.coverageResolver = coverageResolver;
		this.quoteService = quoteService;
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
			String metadataUri,
			PolicyCoverageSnapshot coverage) {
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
		applyCoverage(record, coverage);
		return repository.save(record);
	}

	@Transactional
	public PolicyRecord applyCoverage(PolicyRecord record, PolicyCoverageSnapshot coverage) {
		if (coverage == null) {
			return record;
		}
		record.setProductCategory(PolicyCoverageResolver.normalizeProductCategory(
				coverage.productCategory(),
				record.getProductTitle()));
		record.setCoverStartAt(coverage.coverStartAt());
		record.setCoverExpiresAt(coverage.coverExpiresAt());
		record.setCoverageLimitGbp(coverage.coverageLimitGbp());
		record.setCoverageSummary(coverage.coverageSummary());
		record.setCoverageDetailsJson(coverageResolver.serializeCoverageItems(coverage.coverageItems()));
		return record;
	}

	@Transactional
	public PolicyRecord saveWithCoverage(PolicyRecord record, PolicyCoverageSnapshot coverage) {
		applyCoverage(record, coverage);
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
		Instant activatedAt = Instant.now();
		record.setActivatedAt(activatedAt);
		activateCoverageOnMint(record, activatedAt);
		return repository.save(record);
	}

	private void activateCoverageOnMint(PolicyRecord record, Instant activatedAt) {
		if (!StringUtils.hasText(record.getQuoteId())) {
			applyCoverage(record, coverageResolver.activateFallback(
					record.getProductCategory(), record.getProductTitle(), activatedAt));
			return;
		}
		try {
			Map<String, Object> quote = quoteService.getQuote(record.getQuoteId());
			applyCoverage(record, coverageResolver.activateOnMint(quote, activatedAt));
		}
		catch (Exception ex) {
			applyCoverage(record, coverageResolver.activateFallback(
					record.getProductCategory(), record.getProductTitle(), activatedAt));
		}
	}

	@Transactional
	public PolicyRecord ensureMintActivatedCoverage(PolicyRecord record) {
		if (!"MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return record;
		}
		record = syncTravelCoverageLimits(record);
		record = syncMotorCoverageLimits(record);
		Instant activated = record.getActivatedAt() == null ? Instant.now() : record.getActivatedAt();
		if (record.getActivatedAt() == null) {
			record.setActivatedAt(activated);
		}
		String normalized = PolicyCoverageResolver.normalizeProductCategory(
				record.getProductCategory(),
				record.getProductTitle());
		if (!normalized.equals(record.getProductCategory())) {
			record.setProductCategory(normalized);
		}
		if (record.getCoverStartAt() != null && !record.getCoverStartAt().isBefore(activated.minus(1, ChronoUnit.HOURS))) {
			return repository.save(record);
		}
		activateCoverageOnMint(record, activated);
		return repository.save(record);
	}

	private PolicyRecord syncTravelCoverageLimits(PolicyRecord record) {
		String category = PolicyCoverageResolver.normalizeProductCategory(
				record.getProductCategory(),
				record.getProductTitle());
		if (!"Travel".equalsIgnoreCase(category) || !StringUtils.hasText(record.getQuoteId())) {
			return record;
		}
		try {
			Map<String, Object> quote = quoteService.getQuote(record.getQuoteId());
			Instant start = record.getCoverStartAt();
			PolicyCoverageSnapshot snap = start == null
					? coverageResolver.resolvePendingFromQuote(quote)
					: coverageResolver.activateOnMint(quote, start);
			applyCoverage(record, snap);
			return repository.save(record);
		}
		catch (Exception ignored) {
			return record;
		}
	}

	private PolicyRecord syncMotorCoverageLimits(PolicyRecord record) {
		if (!StringUtils.hasText(record.getQuoteId())) {
			return record;
		}
		try {
			Map<String, Object> quote = quoteService.getQuote(record.getQuoteId());
			if (!MotorCoverageLimits.PRODUCT_ID.equalsIgnoreCase(str(quote.get("product_id")))) {
				return record;
			}
			Instant start = record.getCoverStartAt();
			PolicyCoverageSnapshot snap = start == null
					? coverageResolver.resolvePendingFromQuote(quote)
					: coverageResolver.activateOnMint(quote, start);
			applyCoverage(record, snap);
			return repository.save(record);
		}
		catch (Exception ignored) {
			return record;
		}
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
		map.put("product_category", PolicyCoverageResolver.normalizeProductCategory(
				record.getProductCategory(),
				record.getProductTitle()));
		map.put("cover_start_at", record.getCoverStartAt() == null ? null : record.getCoverStartAt().toString());
		map.put("cover_expires_at", record.getCoverExpiresAt() == null ? null : record.getCoverExpiresAt().toString());
		map.put("coverage_limit_gbp", record.getCoverageLimitGbp());
		map.put("coverage_summary", record.getCoverageSummary());
		map.put("coverage_items", coverageResolver.parseCoverageItems(record.getCoverageDetailsJson()));
		map.put("coverage_expired", isCoverageExpired(record));
		map.put("coverage_active", isCoverageActive(record));
		map.put("coverage_pending_mint", isCoveragePendingMint(record));
		return map;
	}

	private static boolean isCoverageActive(PolicyRecord record) {
		if (!"MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return false;
		}
		if (record.getCoverStartAt() == null) {
			return false;
		}
		if (Instant.now().isBefore(record.getCoverStartAt())) {
			return false;
		}
		return !isCoverageExpired(record);
	}

	private static boolean isCoveragePendingMint(PolicyRecord record) {
		return !"MINTED".equalsIgnoreCase(record.getMintStatus()) || record.getCoverStartAt() == null;
	}

	private static boolean isCoverageExpired(PolicyRecord record) {
		if (record.getCoverExpiresAt() == null) {
			return false;
		}
		return Instant.now().isAfter(record.getCoverExpiresAt());
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
