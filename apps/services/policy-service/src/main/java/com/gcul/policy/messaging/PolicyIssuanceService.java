package com.gcul.policy.messaging;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;
import com.gcul.policy.client.BlockchainMintClient;
import com.gcul.policy.client.BlockchainMintClient.PolicyRecordView;
import com.gcul.policy.client.KycInternalClient;
import com.gcul.policy.client.WalletLookupClient;
import com.gcul.policy.client.WalletLookupClient.WalletLookup;
import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.policy.PolicyCoverageResolver;
import com.gcul.policy.policy.PolicyCoverageSnapshot;
import com.gcul.policy.policy.PolicyRecordService;
import com.gcul.policy.policy.PolicyReferenceHasher;
import com.gcul.policy.quote.QuoteService;
import com.gcul.policy.travel.TravelParametricProvisioner;
import com.gcul.policy.motor.MotorParametricProvisioner;

@Service
public class PolicyIssuanceService {

	private static final Logger log = LoggerFactory.getLogger(PolicyIssuanceService.class);

	private final QuoteService quotes;
	private final GculEventPublisher publisher;
	private final BlockchainMintClient blockchainMintClient;
	private final WalletLookupClient walletLookupClient;
	private final KycInternalClient kycInternalClient;
	private final PolicyRecordService policyRecords;
	private final TravelParametricProvisioner travelParametricProvisioner;
	private final MotorParametricProvisioner motorParametricProvisioner;
	private final PolicyCoverageResolver coverageResolver;

	public PolicyIssuanceService(
			QuoteService quotes,
			GculEventPublisher publisher,
			BlockchainMintClient blockchainMintClient,
			WalletLookupClient walletLookupClient,
			KycInternalClient kycInternalClient,
			PolicyRecordService policyRecords,
			TravelParametricProvisioner travelParametricProvisioner,
			MotorParametricProvisioner motorParametricProvisioner,
			PolicyCoverageResolver coverageResolver) {
		this.quotes = quotes;
		this.publisher = publisher;
		this.blockchainMintClient = blockchainMintClient;
		this.walletLookupClient = walletLookupClient;
		this.kycInternalClient = kycInternalClient;
		this.policyRecords = policyRecords;
		this.travelParametricProvisioner = travelParametricProvisioner;
		this.motorParametricProvisioner = motorParametricProvisioner;
		this.coverageResolver = coverageResolver;
	}

	public void onPremiumPaid(Map<String, Object> payload) {
		String quoteId = firstNonBlank(str(payload.get("quoteId")), str(payload.get("quote_id")));
		if (quoteId.isBlank()) {
			log.warn("PremiumPaid missing quoteId");
			return;
		}
		if (policyRecords.findByQuoteId(quoteId).isPresent()) {
			log.debug("Policy already issued for quote {} — checking mint retry", quoteId);
			maybeRetryMint(policyRecords.findByQuoteId(quoteId).orElseThrow(), payload);
			return;
		}

		Map<String, Object> quote;
		try {
			quote = quotes.getQuote(quoteId);
		}
		catch (Exception ex) {
			log.warn("Quote {} not found for PremiumPaid: {}", quoteId, ex.getMessage());
			return;
		}

		String policyId = "POL-" + quoteId.replace("Q-", "");
		String policyNumber = policyId;
		String customerEmail = firstNonBlank(
				str(payload.get("customerEmail")),
				extractEmail(quote)).toLowerCase(java.util.Locale.ROOT);
		if (!isKnown(customerEmail)) {
			customerEmail = "";
		}

		WalletLookup wallet = resolveWallet(customerEmail, payload.get("walletAddress"));
		String customerId = firstNonBlank(
				str(payload.get("customerId")),
				wallet.userId(),
				customerEmail);
		if (!isKnown(customerId)) {
			customerId = customerEmail;
		}
		String walletAddress = wallet.address();
		String productTitle = String.valueOf(quote.getOrDefault("product_title", "Insurance"));
		String policyReferenceHash = PolicyReferenceHasher.hash(policyId, policyNumber, customerId, quoteId);
		String metadataUri = "ipfs://gcul-policy/" + policyId;
		PolicyCoverageSnapshot coverage = coverageResolver.resolvePendingFromQuote(quote);

		PolicyRecord record = policyRecords.createIssuedPolicy(
				policyId,
				policyNumber,
				quoteId,
				customerId,
				customerEmail,
				productTitle,
				walletAddress,
				policyReferenceHash,
				metadataUri,
				coverage);

		Map<String, Object> created = new LinkedHashMap<>();
		created.put("eventType", "PolicyCreated");
		created.put("policyId", policyId);
		created.put("policyNumber", policyNumber);
		created.put("quoteId", quoteId);
		created.put("customerId", customerId);
		created.put("productTitle", productTitle);
		created.put("status", "ISSUED");
		publisher.publish(EventTopics.POLICY, created);

		if (!wallet.connected() || walletAddress.isBlank()) {
			log.warn("Policy {} issued off-chain — awaiting verified wallet before mint", policyId);
			return;
		}

		if (!kycInternalClient.isVerified(customerId)) {
			log.warn("Policy {} mint deferred — customer {} not KYC verified", policyId, customerId);
			return;
		}

		requestBlockchainMint(record, true, false);
		log.info("Issued policy {} for quote {}", policyId, quoteId);
	}

	public void onPolicyMinted(Map<String, Object> payload) {
		String policyId = str(payload.get("policyId"));
		if (policyId.isBlank()) {
			return;
		}
		policyRecords.findByPolicyId(policyId).ifPresent(record -> {
			boolean alreadyMinted = "MINTED".equalsIgnoreCase(record.getMintStatus())
					&& record.getTokenId() != null
					&& record.getTokenId().equals(str(payload.get("tokenId")));
			if (!alreadyMinted) {
				policyRecords.applyMintResult(policyId, payload);
			}
			policyRecords.findByPolicyId(policyId).ifPresent(travelParametricProvisioner::provisionForMintedPolicy);
			policyRecords.findByPolicyId(policyId).ifPresent(motorParametricProvisioner::provisionForMintedPolicy);
			if (alreadyMinted) {
				return;
			}
			Map<String, Object> activated = new LinkedHashMap<>();
			activated.put("eventType", "PolicyActivated");
			activated.put("policyId", policyId);
			activated.put("tokenId", payload.get("tokenId"));
			activated.put("status", "ACTIVE");
			publisher.publish(EventTopics.POLICY, activated);
		});
	}

	public void onWalletLinked(Map<String, Object> payload) {
		String customerId = str(payload.get("customerId"));
		String walletAddress = str(payload.get("walletAddress"));
		log.info("Wallet linked for customer {} address {} — checking pending policy mints",
				customerId, walletAddress);

		if (customerId.isBlank() || walletAddress.isBlank()) {
			return;
		}
		if (!kycInternalClient.isVerified(customerId)) {
			return;
		}

		for (PolicyRecord pending : policyRecords.listPendingMint()) {
			if (!customerId.equals(pending.getCustomerId())
					&& !customerId.equalsIgnoreCase(pending.getCustomerEmail())) {
				continue;
			}
			policyRecords.attachWallet(pending.getPolicyId(), walletAddress);
			requestBlockchainMint(pending, true, false);
		}
	}

	public Map<String, Object> getPolicy(String policyId) {
		return policyRecords.findByPolicyId(policyId)
				.map(this::ensureCoverageOnRecord)
				.map(policyRecords::toResponse)
				.orElse(null);
	}

	private PolicyRecord ensureCoverageOnRecord(PolicyRecord record) {
		if ("MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return policyRecords.ensureMintActivatedCoverage(record);
		}
		if (record.getCoverageLimitGbp() != null) {
			return record;
		}
		if (!StringUtils.hasText(record.getQuoteId())) {
			return policyRecords.saveWithCoverage(record,
					coverageResolver.resolveFallback(record.getProductCategory(), record.getProductTitle(), null));
		}
		try {
			Map<String, Object> quote = quotes.getQuote(record.getQuoteId());
			PolicyCoverageSnapshot coverage = coverageResolver.resolvePendingFromQuote(quote);
			return policyRecords.saveWithCoverage(record, coverage);
		}
		catch (Exception ex) {
			log.debug("Could not backfill coverage for {}: {}", record.getPolicyId(), ex.getMessage());
			return policyRecords.saveWithCoverage(record,
					coverageResolver.resolveFallback(record.getProductCategory(), record.getProductTitle(), null));
		}
	}

	public java.util.Optional<Map<String, Object>> findPolicyByQuote(String quoteId) {
		return policyRecords.findByQuoteId(quoteId)
				.map(policyRecords::toResponse);
	}

	public List<Map<String, Object>> listCustomerPolicies(String customerId, String email) {
		String walletAddress = "";
		if (StringUtils.hasText(email) && !"unknown".equalsIgnoreCase(email.trim())) {
			WalletLookup wallet = walletLookupClient.lookupByEmail(email.trim());
			if (wallet.connected()) {
				walletAddress = wallet.address();
			}
		}
		if (!StringUtils.hasText(walletAddress) && StringUtils.hasText(customerId)
				&& !"unknown".equalsIgnoreCase(customerId.trim())) {
			WalletLookup wallet = walletLookupClient.lookupByCustomerId(customerId.trim());
			if (wallet.connected()) {
				walletAddress = wallet.address();
			}
		}
		return policyRecords.listForCustomer(customerId, email, walletAddress).stream()
				.map(this::ensureCoverageOnRecord)
				.map(policyRecords::toResponse)
				.toList();
	}

	public Map<String, Object> adminApproveMint(String policyId) {
		PolicyRecord record = policyRecords.findByPolicyId(policyId)
				.orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
						org.springframework.http.HttpStatus.NOT_FOUND, "Policy not found"));
		if ("MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return policyRecords.toResponse(record);
		}

		PolicyRecord current = record;
		if (!StringUtils.hasText(current.getWalletAddress())) {
			WalletLookup wallet = walletLookupClient.lookupByEmail(current.getCustomerEmail());
			if (!wallet.connected() || wallet.address().isBlank()) {
				// Fall back to customer id lookup for wallet-service linkage
				wallet = walletLookupClient.lookupByCustomerId(current.getCustomerId());
			}
			if (!wallet.connected() || wallet.address().isBlank()) {
				throw new org.springframework.web.server.ResponseStatusException(
						org.springframework.http.HttpStatus.BAD_REQUEST,
						"Customer wallet not linked — ask customer to link wallet first");
			}
			current = policyRecords.attachWallet(policyId, wallet.address());
		}

		if ("FAILED".equalsIgnoreCase(current.getMintStatus())) {
			current = policyRecords.resetMintForRetry(policyId);
		}

		// Admin approve = insurer authorization to mint on Canton (KYC not re-checked here).
		requestBlockchainMint(current, true, true);
		PolicyRecord updated = policyRecords.findByPolicyId(policyId).orElseThrow();
		if (!"MINTED".equalsIgnoreCase(updated.getMintStatus())) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Canton mint did not complete — status is " + updated.getMintStatus()
							+ ". Ensure Canton sandbox and blockchain orchestrator are running.");
		}
		return policyRecords.toResponse(updated);
	}

	public Map<String, Object> adminRejectMint(String policyId) {
		PolicyRecord record = policyRecords.findByPolicyId(policyId)
				.orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
						org.springframework.http.HttpStatus.NOT_FOUND, "Policy not found"));
		if ("MINTED".equalsIgnoreCase(record.getMintStatus())) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.CONFLICT, "Policy already minted");
		}
		policyRecords.markMintFailed(policyId, "Rejected by admin");
		return policyRecords.toResponse(policyRecords.findByPolicyId(policyId).orElseThrow());
	}

	private void maybeRetryMint(PolicyRecord record, Map<String, Object> payload) {
		if ("MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return;
		}
		String customerEmail = record.getCustomerEmail();
		WalletLookup wallet = resolveWallet(customerEmail, payload.get("walletAddress"));
		if (!wallet.connected() || wallet.address().isBlank()) {
			return;
		}
		PolicyRecord current = record;
		if (current.getWalletAddress() == null || current.getWalletAddress().isBlank()) {
			current = policyRecords.attachWallet(record.getPolicyId(), wallet.address());
		}
		String customerId = firstNonBlank(current.getCustomerId(), wallet.userId(), customerEmail);
		if (!kycInternalClient.isVerified(customerId)) {
			return;
		}
		requestBlockchainMint(current, true, false);
	}

	private void requestBlockchainMint(PolicyRecord record, boolean kycVerified, boolean throwOnFailure) {
		if ("MINTED".equalsIgnoreCase(record.getMintStatus())) {
			return;
		}
		if (policyRecords.isCancelled(record)) {
			log.warn("Mint skipped for cancelled policy {}", record.getPolicyId());
			return;
		}
		if (!approveCompliance(record, kycVerified)) {
			policyRecords.markMintFailed(record.getPolicyId(), "Compliance checks did not approve policy minting");
			return;
		}
		Map<String, Object> mintRequest = blockchainMintClient.buildMintRequest(toView(record), kycVerified);
		Map<String, Object> requested = new LinkedHashMap<>(mintRequest);
		requested.put("eventType", "PolicyMintRequested");
		publisher.publish(EventTopics.POLICY, requested);

		try {
			Map<String, Object> mintResult = blockchainMintClient.mintPolicyNft(mintRequest);
			onPolicyMinted(mintResult);
		}
		catch (Exception ex) {
			policyRecords.markMintFailed(record.getPolicyId(), ex.getMessage());
			log.error("Blockchain mint failed for {}: {}", record.getPolicyId(), ex.getMessage());
			if (throwOnFailure) {
				throw new org.springframework.web.server.ResponseStatusException(
						org.springframework.http.HttpStatus.BAD_GATEWAY,
						"Canton mint failed: " + ex.getMessage());
			}
		}
	}

	private boolean approveCompliance(PolicyRecord record, boolean kycVerified) {
		boolean consent = record.getCustomerEmail() != null && !record.getCustomerEmail().isBlank();
		boolean duplicate = record.getTokenId() != null && !record.getTokenId().isBlank();
		double fraudScore = Math.abs((record.getPolicyReferenceHash() + record.getCustomerId()).hashCode() % 100) / 100.0;
		boolean approved = consent && kycVerified && !duplicate && fraudScore < 0.80;
		record.setComplianceFraudScore(fraudScore);
		record.setComplianceDecision(approved ? "APPROVED" : "REJECTED");
		String payload = record.getPolicyId() + "|" + record.getPolicyReferenceHash() + "|" + consent + "|" + kycVerified + "|" + fraudScore;
		record.setComplianceAttestation("DEMO-COMP-" + Integer.toHexString(payload.hashCode()).toUpperCase(java.util.Locale.ROOT));
		policyRecords.save(record);
		return approved;
	}

	private PolicyRecordView toView(PolicyRecord record) {
		return new PolicyRecordView(
				record.getPolicyId(),
				record.getPolicyNumber(),
				record.getQuoteId(),
				record.getCustomerId(),
				record.getWalletAddress(),
				record.getPolicyReferenceHash(),
				record.getMetadataUri(),
				record.getProductTitle(),
				record.getProductCategory(),
				record.getCoverageSummary(),
				record.getCoverExpiresAt() == null ? null : record.getCoverExpiresAt().toString(),
				record.getCoverageLimitGbp());
	}

	private WalletLookup resolveWallet(String customerEmail, Object eventWallet) {
		if (eventWallet != null && !String.valueOf(eventWallet).isBlank()) {
			String address = String.valueOf(eventWallet).trim();
			WalletLookup byEmail = walletLookupClient.lookupByEmail(customerEmail);
			return new WalletLookup(byEmail.userId(), address, true);
		}
		WalletLookup byEmail = walletLookupClient.lookupByEmail(customerEmail);
		if (byEmail.connected()) {
			return byEmail;
		}
		return WalletLookup.empty();
	}

	private static String extractEmail(Map<String, Object> quote) {
		Object answersObj = quote.get("answers");
		if (answersObj instanceof Map<?, ?> answers) {
			Object email = answers.get("email");
			if (email != null && !String.valueOf(email).isBlank()) {
				return String.valueOf(email).trim();
			}
		}
		return "";
	}

	private static boolean isKnown(String value) {
		if (!StringUtils.hasText(value)) {
			return false;
		}
		String normalized = value.trim().toLowerCase(java.util.Locale.ROOT);
		return !normalized.equals("unknown") && !normalized.equals("n/a") && !normalized.equals("-");
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (StringUtils.hasText(value)) {
				return value.trim();
			}
		}
		return "";
	}
}
