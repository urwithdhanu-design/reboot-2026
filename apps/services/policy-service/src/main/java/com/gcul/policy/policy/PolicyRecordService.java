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

import com.gcul.policy.model.PolicyLedgerAttestation;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.motor.MotorCoverageLimits;
import com.gcul.policy.quote.QuoteService;
import com.gcul.policy.repository.PolicyLedgerAttestationRepository;
import com.gcul.policy.repository.PolicyRecordRepository;

@Service
public class PolicyRecordService {

	private final PolicyRecordRepository repository;
	private final PolicyLedgerAttestationRepository attestationRepository;
	private final PolicyCoverageResolver coverageResolver;
	private final QuoteService quoteService;
	private final ObjectMapper objectMapper;

	public PolicyRecordService(
			PolicyRecordRepository repository,
			PolicyLedgerAttestationRepository attestationRepository,
			PolicyCoverageResolver coverageResolver,
			QuoteService quoteService,
			ObjectMapper objectMapper) {
		this.repository = repository;
		this.attestationRepository = attestationRepository;
		this.coverageResolver = coverageResolver;
		this.quoteService = quoteService;
		this.objectMapper = objectMapper;
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
	public PolicyRecord applyQuoteSnapshot(PolicyRecord record, Map<String, Object> quote) {
		if (quote == null) {
			return record;
		}
		record.setProductId(firstNonBlank(str(quote.get("product_id")), record.getProductId()));
		Object answers = quote.get("answers");
		if (answers instanceof Map<?, ?> map) {
			try {
				record.setQuoteAnswersJson(objectMapper.writeValueAsString(map));
			}
			catch (JsonProcessingException ignored) {
				// keep existing snapshot
			}
		}
		return repository.save(record);
	}

	@Transactional
	public PolicyRecord linkRenewal(String predecessorPolicyId, String renewalPolicyId) {
		PolicyRecord predecessor = repository.findById(predecessorPolicyId).orElseThrow();
		PolicyRecord renewal = repository.findById(renewalPolicyId).orElseThrow();
		predecessor.setRenewedByPolicyId(renewalPolicyId);
		renewal.setPredecessorPolicyId(predecessorPolicyId);
		repository.save(predecessor);
		return repository.save(renewal);
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
		String ledgerId = firstNonBlank(str(mintResult.get("ledgerId")), str(mintResult.get("mode")), "canton");
		record.setTokenId(str(mintResult.get("tokenId")));
		record.setTransactionHash(str(mintResult.get("transactionHash")));
		record.setContractAddress(str(mintResult.get("contractAddress")));
		record.setBlockchainNetwork(str(mintResult.get("network")));
		record.setPrimaryLedgerId(ledgerId);
		record.setMintStatus(str(mintResult.getOrDefault("mintStatus", "MINTED")));
		Object blockNumber = mintResult.get("blockNumber");
		if (blockNumber instanceof Number number) {
			record.setBlockNumber(number.longValue());
		}
		record.setStatus("active");
		Instant activatedAt = Instant.now();
		record.setActivatedAt(activatedAt);
		activateCoverageOnMint(record, activatedAt);
		saveAttestation(record, mintResult, ledgerId);
		return repository.save(record);
	}

	private void saveAttestation(PolicyRecord record, Map<String, Object> mintResult, String ledgerId) {
		PolicyLedgerAttestation attestation = attestationRepository
				.findByPolicyIdAndLedgerId(record.getPolicyId(), ledgerId)
				.orElseGet(PolicyLedgerAttestation::new);
		attestation.setPolicyId(record.getPolicyId());
		attestation.setLedgerId(ledgerId);
		attestation.setPolicyReferenceHash(firstNonBlank(
				str(mintResult.get("policyReferenceHash")),
				record.getPolicyReferenceHash()));
		attestation.setTokenId(str(mintResult.get("tokenId")));
		attestation.setTransactionHash(str(mintResult.get("transactionHash")));
		attestation.setContractRef(str(mintResult.get("contractAddress")));
		attestation.setNetwork(str(mintResult.get("network")));
		attestation.setMintStatus(str(mintResult.getOrDefault("mintStatus", "MINTED")));
		Object blockNumber = mintResult.get("blockNumber");
		if (blockNumber instanceof Number number) {
			attestation.setBlockNumber(number.longValue());
		}
		attestation.setExplorerUrl(buildExplorerUrl(ledgerId, str(mintResult.get("transactionHash"))));
		attestation.setAttestedAt(Instant.now());
		attestationRepository.save(attestation);
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
		if (isCancelled(record)) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.CONFLICT, "Policy is cancelled");
		}
		if ("MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return record;
		}
		record.setMintStatus("PENDING");
		record.setStatus("issued");
		record.setMintFailureReason(null);
		record.setMintFailedAt(null);
		return repository.save(record);
	}

	@Transactional
	public PolicyRecord markMintFailed(String policyId, String reason) {
		PolicyRecord record = repository.findById(policyId).orElseThrow();
		record.setMintStatus("FAILED");
		record.setStatus("mint_failed");
		record.setMintFailureReason(reason);
		record.setMintFailedAt(Instant.now());
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

	@Transactional
	public PolicyRecord cancelPolicy(
			String policyId,
			String cancellationReason,
			String cancellationType,
			String cancellationNote,
			String refundStatus,
			double refundAmountGbp,
			String refundPaymentId) {
		PolicyRecord record = repository.findById(policyId).orElseThrow();
		record.setStatus("cancelled");
		record.setCancelledAt(Instant.now());
		record.setCancellationReason(cancellationReason);
		record.setCancellationType(cancellationType);
		record.setCancellationNote(cancellationNote);
		record.setRefundStatus(refundStatus);
		record.setRefundAmountGbp(refundAmountGbp);
		record.setRefundPaymentId(refundPaymentId);
		return repository.save(record);
	}

	public boolean isCancelled(PolicyRecord record) {
		return "cancelled".equalsIgnoreCase(record.getStatus());
	}

	public Optional<PolicyRecord> findByPolicyId(String policyId) {
		return repository.findById(policyId);
	}

	@Transactional
	public PolicyRecord save(PolicyRecord record) {
		return repository.save(record);
	}

	public Optional<PolicyRecord> findByQuoteId(String quoteId) {
		return repository.findByQuoteId(quoteId);
	}

	@Transactional
	public PolicyRecord consumeCoverage(String policyId, double amount) {
		if (amount <= 0) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST, "Claim payout amount must be greater than zero");
		}
		PolicyRecord record = repository.findById(policyId).orElseThrow(() ->
				new org.springframework.web.server.ResponseStatusException(
						org.springframework.http.HttpStatus.NOT_FOUND, "Policy not found"));
		Double limit = record.getCoverageLimitGbp();
		if (limit == null || limit <= 0) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.CONFLICT, "Policy has no claimable coverage limit");
		}
		double used = record.getCoverageUsedGbp() == null ? 0.0 : record.getCoverageUsedGbp();
		double remaining = Math.max(0, limit - used);
		if (amount > remaining + 0.001) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.CONFLICT,
						"Claim payout exceeds remaining policy coverage of £" + String.format(java.util.Locale.ROOT, "%.2f", remaining));
		}
		record.setCoverageUsedGbp(roundMoney(used + amount));
		return repository.save(record);
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
				java.util.List.of("PENDING", "PENDING_WALLET"));
	}

	public List<PolicyRecord> listFailedMints() {
		return repository.findByMintStatusOrderByIssuedAtDesc("FAILED");
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
		map.put("primary_ledger_id", record.getPrimaryLedgerId());
		map.put("mint_status", record.getMintStatus());
		map.put("mint_failure_reason", record.getMintFailureReason());
		map.put("mint_failed_at", record.getMintFailedAt() == null ? null : record.getMintFailedAt().toString());
		map.put("compliance_decision", record.getComplianceDecision());
		map.put("compliance_attestation", record.getComplianceAttestation());
		map.put("compliance_fraud_score", record.getComplianceFraudScore());
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
		double usedCoverage = record.getCoverageUsedGbp() == null ? 0.0 : record.getCoverageUsedGbp();
		map.put("coverage_used_gbp", roundMoney(usedCoverage));
		map.put("coverage_remaining_gbp", record.getCoverageLimitGbp() == null ? null
				: roundMoney(Math.max(0, record.getCoverageLimitGbp() - usedCoverage)));
		map.put("coverage_summary", record.getCoverageSummary());
		map.put("coverage_items", coverageResolver.parseCoverageItems(record.getCoverageDetailsJson()));
		map.put("coverage_expired", isCoverageExpired(record));
		map.put("coverage_active", isCoverageActive(record));
		map.put("coverage_pending_mint", isCoveragePendingMint(record));
		map.put("cancelled_at", record.getCancelledAt() == null ? null : record.getCancelledAt().toString());
		map.put("cancellation_reason", record.getCancellationReason());
		map.put("cancellation_type", record.getCancellationType());
		map.put("cancellation_note", record.getCancellationNote());
		map.put("refund_status", record.getRefundStatus());
		map.put("refund_amount_gbp", record.getRefundAmountGbp());
		map.put("refund_payment_id", record.getRefundPaymentId());
		map.put("product_id", record.getProductId());
		map.put("predecessor_policy_id", record.getPredecessorPolicyId());
		map.put("renewed_by_policy_id", record.getRenewedByPolicyId());
		map.put("renewal_eligible", isRenewalEligible(record));
		return map;
	}

	private static boolean isRenewalEligible(PolicyRecord record) {
		if ("cancelled".equalsIgnoreCase(record.getStatus())) {
			return false;
		}
		if (StringUtils.hasText(record.getRenewedByPolicyId())) {
			return false;
		}
		if (!"MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return false;
		}
		if (record.getCoverExpiresAt() == null) {
			return false;
		}
		long now = Instant.now().toEpochMilli();
		long end = record.getCoverExpiresAt().toEpochMilli();
		long window = 30L * 24 * 60 * 60 * 1000;
		long grace = 7L * 24 * 60 * 60 * 1000;
		return now >= end - window && now <= end + grace;
	}

	private static boolean isCoverageActive(PolicyRecord record) {
		if ("cancelled".equalsIgnoreCase(record.getStatus())) {
			return false;
		}
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

	private static double roundMoney(double value) {
		return Math.round(value * 100.0) / 100.0;
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
		if (StringUtils.hasText(record.getPrimaryLedgerId())) {
			return record.getPrimaryLedgerId();
		}
		String network = record.getBlockchainNetwork() == null ? "" : record.getBlockchainNetwork().toLowerCase();
		if (network.contains("canton")) {
			return "canton";
		}
		if (record.getTransactionHash() != null && record.getTransactionHash().startsWith("0xsim")) {
			return "simulated";
		}
		return "simulated";
	}

	private static String buildExplorerUrl(PolicyRecord record) {
		return buildExplorerUrl(ledgerType(record), record.getTransactionHash());
	}

	private static String buildExplorerUrl(String ledgerId, String transactionHash) {
		if (transactionHash == null || transactionHash.isBlank()) {
			return null;
		}
		if (transactionHash.startsWith("0xsim")) {
			return null;
		}
		return null;
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (StringUtils.hasText(value)) {
				return value.trim();
			}
		}
		return "";
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
