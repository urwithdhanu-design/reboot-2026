package com.gcul.claims.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.claims.client.BlockchainValidationClient;
import com.gcul.claims.client.PolicyValidationClient;
import com.gcul.claims.client.WalletPayoutClient;
import com.gcul.claims.messaging.ClaimEventPublisher;
import com.gcul.claims.model.ClaimStatus;
import com.gcul.claims.model.InsuranceClaim;
import com.gcul.claims.repository.ClaimRepository;
import com.gcul.claims.service.ClaimDocumentService;
import com.gcul.claims.service.ClaimQueryService;

@Service
public class ClaimWorkflowService {

	private static final Logger log = LoggerFactory.getLogger(ClaimWorkflowService.class);

	private static final Set<String> ADMIN_STATUSES = Set.of(
			ClaimStatus.IN_REVIEW,
			ClaimStatus.PENDING_APPROVAL,
			ClaimStatus.APPROVED,
			ClaimStatus.REJECTED);

	private final ClaimRepository repo;
	private final ClaimEventPublisher claimEvents;
	private final PolicyValidationClient policyClient;
	private final BlockchainValidationClient blockchainClient;
	private final WalletPayoutClient walletClient;
	private final ClaimDocumentService claimDocuments;
	private final ClaimQueryService claimQueries;
	private final ClaimCoverageValidator coverageValidator;

	public ClaimWorkflowService(
			ClaimRepository repo,
			ClaimEventPublisher claimEvents,
			PolicyValidationClient policyClient,
			BlockchainValidationClient blockchainClient,
			WalletPayoutClient walletClient,
			ClaimDocumentService claimDocuments,
			ClaimQueryService claimQueries,
			ClaimCoverageValidator coverageValidator) {
		this.repo = repo;
		this.claimEvents = claimEvents;
		this.policyClient = policyClient;
		this.blockchainClient = blockchainClient;
		this.walletClient = walletClient;
		this.claimDocuments = claimDocuments;
		this.claimQueries = claimQueries;
		this.coverageValidator = coverageValidator;
	}

	@Transactional
	public Map<String, Object> create(Map<String, Object> body) {
		String policyRef = str(body.get("policy_ref"));
		if (policyRef.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policy_ref is required");
		}
		double amount = num(body.get("amount_claimed"), 0);
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount_claimed must be greater than zero");
		}

		Map<String, Object> policy = policyClient.fetchPolicy(policyRef);
		policyClient.assertEligibleForClaim(policy);
		String claimCategory = firstNonBlank(str(body.get("category")), str(policy.get("product_category")), "General");
		coverageValidator.assertClaimAllowed(policy, claimCategory, amount);

		String policyReferenceHash = str(policy.get("policy_reference_hash"));
		Map<String, Object> canton = blockchainClient.verifyCantonPolicy(policyRef, policyReferenceHash);
		blockchainClient.assertVerifiedOnCanton(canton, policy);
		if (!Boolean.TRUE.equals(canton.get("verified"))) {
			Map<String, Object> mintRecord = blockchainClient.fetchMintRecord(policyRef);
			if (mintRecord.get("tokenId") != null) {
				canton = new java.util.LinkedHashMap<>(canton);
				canton.put("verified", true);
				canton.put("contractId", mintRecord.get("tokenId"));
			}
		}

		InsuranceClaim claim = new InsuranceClaim();
		claim.setId("CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		claim.setPolicyRef(policyRef);
		claim.setCustomerName(firstNonBlank(str(body.get("customer_name")), knownIdentity(str(policy.get("customer_email"))), "Customer"));
		claim.setCustomerId(knownIdentity(firstNonBlank(str(body.get("customer_id")), str(policy.get("customer_id")))));
		claim.setCustomerEmail(knownIdentity(firstNonBlank(str(body.get("customer_email")), str(policy.get("customer_email")))));
		claim.setPolicyReferenceHash(policyReferenceHash);
		claim.setCantonContractId(str(canton.get("contractId")));
		claim.setCategory(claimCategory);
		claim.setAmountClaimed(amount);
		claim.setDescription(str(body.get("description")));
		claim.setSource(firstNonBlank(str(body.get("source")), "manual"));
		claim.setStatus(ClaimStatus.SUBMITTED);
		claim.setValidationNotes("Policy verified on Canton ledger · within coverage limits");
		claim.setCreatedAt(Instant.now());
		claim.setUpdatedAt(Instant.now());

		InsuranceClaim saved = repo.save(claim);
		claimEvents.claimSubmitted(saved);

		saved.setStatus(ClaimStatus.PENDING_APPROVAL);
		saved.setUpdatedAt(Instant.now());
		saved = repo.save(saved);
		claimEvents.claimValidated(saved);
		claimEvents.claimPendingApproval(saved);

		log.info("Claim {} submitted for policy {} — pending admin approval", saved.getId(), policyRef);
		return toMap(saved);
	}

	@Transactional
	public Map<String, Object> createParametricAutoSettle(Map<String, Object> body) {
		body.put("source", "parametric");
		String defaultCategory = "trip_cancellation".equalsIgnoreCase(str(body.get("parametric_event_type")))
				? "Trip cancellation"
				: "Flight delay";
		body.put("category", firstNonBlank(str(body.get("category")), defaultCategory));

		String policyRef = str(body.get("policy_ref"));
		if (policyRef.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policy_ref is required");
		}
		double amount = num(body.get("amount_claimed"), 0);
		if (amount <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount_claimed must be greater than zero");
		}

		Map<String, Object> policy = policyClient.fetchPolicy(policyRef);
		policyClient.assertEligibleForClaim(policy);
		String claimCategory = firstNonBlank(str(body.get("category")), defaultCategory);
		coverageValidator.assertClaimAllowed(policy, claimCategory, amount, true);

		String policyReferenceHash = str(policy.get("policy_reference_hash"));
		Map<String, Object> canton = blockchainClient.verifyCantonPolicy(policyRef, policyReferenceHash);
		blockchainClient.assertVerifiedOnCanton(canton, policy);
		if (!Boolean.TRUE.equals(canton.get("verified"))) {
			Map<String, Object> mintRecord = blockchainClient.fetchMintRecord(policyRef);
			if (mintRecord.get("tokenId") != null) {
				canton = new LinkedHashMap<>(canton);
				canton.put("verified", true);
				canton.put("contractId", mintRecord.get("tokenId"));
			}
		}

		InsuranceClaim claim = new InsuranceClaim();
		claim.setId("CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		claim.setPolicyRef(policyRef);
		claim.setCustomerName(firstNonBlank(str(body.get("customer_name")), knownIdentity(str(policy.get("customer_email"))), "Customer"));
		claim.setCustomerId(knownIdentity(firstNonBlank(str(body.get("customer_id")), str(policy.get("customer_id")))));
		claim.setCustomerEmail(knownIdentity(firstNonBlank(str(body.get("customer_email")), str(policy.get("customer_email")))));
		claim.setPolicyReferenceHash(policyReferenceHash);
		claim.setCantonContractId(str(canton.get("contractId")));
		claim.setCategory(str(body.get("category")));
		claim.setAmountClaimed(amount);
		claim.setDescription(str(body.get("description")));
		claim.setSource("parametric");
		claim.setParametricEventType(firstNonBlank(str(body.get("parametric_event_type")), ""));
		claim.setStatus(ClaimStatus.SUBMITTED);
		claim.setValidationNotes("Parametric trigger — Canton policy verified, auto-approval");
		claim.setCreatedAt(Instant.now());
		claim.setUpdatedAt(Instant.now());

		InsuranceClaim saved = repo.save(claim);
		claimEvents.claimSubmitted(saved);
		claimEvents.claimValidated(saved);

		log.info("Parametric claim {} auto-settling for policy {}", saved.getId(), policyRef);
		return approveAndSettle(saved.getId(), body);
	}

	public List<Map<String, Object>> list(String status) {
		List<InsuranceClaim> rows = status == null || status.isBlank()
				? repo.findAllByOrderByCreatedAtDesc()
				: repo.findByStatusOrderByCreatedAtDesc(status);
		return rows.stream().map(this::toMap).toList();
	}

	public Map<String, Object> get(String id) {
		return toMap(find(id));
	}

	@Transactional
	public Map<String, Object> startReview(String id) {
		InsuranceClaim claim = find(id);
		assertTransition(claim, Set.of(ClaimStatus.SUBMITTED, ClaimStatus.PENDING_APPROVAL, ClaimStatus.AWAITING_CUSTOMER));
		claim.setStatus(ClaimStatus.IN_REVIEW);
		claim.setUpdatedAt(Instant.now());
		InsuranceClaim saved = repo.save(claim);
		claimEvents.claimInReview(saved);
		claimEvents.claimPendingApproval(saved);
		return toMap(saved);
	}

	@Transactional
	public Map<String, Object> approveAndSettle(String id, Map<String, Object> body) {
		InsuranceClaim claim = find(id);
		assertTransition(claim, Set.of(
				ClaimStatus.SUBMITTED,
				ClaimStatus.PENDING_APPROVAL,
				ClaimStatus.IN_REVIEW));

		claimQueries.assertNoOpenQueries(id);

		Map<String, Object> policy = policyClient.fetchPolicy(claim.getPolicyRef());
		boolean parametric = "parametric".equalsIgnoreCase(claim.getSource());
		coverageValidator.assertClaimAllowed(policy, claim.getCategory(), claim.getAmountClaimed(), parametric);

		Double approvedAmount = body == null ? null : optionalAmount(body.get("approved_amount"));
		double requested = approvedAmount != null && approvedAmount > 0 ? approvedAmount : claim.getAmountClaimed();
		double capped = coverageValidator.resolveApprovedAmount(policy, claim.getPolicyRef(), requested);
		claim.setApprovedAmount(capped);
		if (capped < requested) {
			claim.setValidationNotes(appendNote(claim.getValidationNotes(),
					String.format(Locale.ROOT, "Approved amount capped to £%,.2f within policy coverage", capped)));
		}

		validatePolicyLink(claim);

		claim.setStatus(ClaimStatus.APPROVED);
		claim.setUpdatedAt(Instant.now());
		claim = repo.save(claim);
		claimEvents.claimApproved(claim);

		claim.setStatus(ClaimStatus.PAYMENT_PENDING);
		claim.setUpdatedAt(Instant.now());
		claim = repo.save(claim);
		claimEvents.claimPaymentPending(claim);

		double payout = claim.getApprovedAmount() == null ? claim.getAmountClaimed() : claim.getApprovedAmount();
		Map<String, Object> policyForPayout = policyClient.fetchPolicy(claim.getPolicyRef());
		String walletAddress = str(policyForPayout.get("wallet_address"));
		Map<String, Object> walletResult = walletClient.creditClaimPayout(
				knownIdentity(claim.getCustomerId()),
				knownIdentity(claim.getCustomerEmail()),
				walletAddress,
				claim.getId(),
				payout);
		String payoutTxId = extractTransactionId(walletResult);
		claim.setPayoutTransactionId(payoutTxId);
		claim.setStatus(ClaimStatus.PAID_OUT);
		claim.setUpdatedAt(Instant.now());
		claim = repo.save(claim);
		claimEvents.claimPaidOut(claim);

		try {
			Map<String, Object> settlement = blockchainClient.settleClaim(
					claim.getId(),
					claim.getPolicyRef(),
					payout,
					claim.getCustomerId());
			claim.setSettlementTransactionId(firstNonBlank(
					str(settlement.get("id")),
					str(settlement.get("digest"))));
		}
		catch (Exception ex) {
			log.warn("Blockchain settlement recorded locally only for claim {}: {}", claim.getId(), ex.getMessage());
			claim.setValidationNotes(appendNote(claim.getValidationNotes(),
					"Wallet credited; blockchain settlement deferred: " + ex.getMessage()));
		}

		claim.setStatus(ClaimStatus.SETTLED);
		claim.setUpdatedAt(Instant.now());
		claim = repo.save(claim);
		claimEvents.claimSettled(claim);

		log.info("Claim {} settled — £{} credited to customer wallet", claim.getId(), payout);
		return toMap(claim);
	}

	@Transactional
	public Map<String, Object> reject(String id, Map<String, Object> body) {
		InsuranceClaim claim = find(id);
		if (ClaimStatus.isTerminal(claim.getStatus())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Claim already finalized");
		}
		claim.setStatus(ClaimStatus.REJECTED);
		claim.setRejectionReason(firstNonBlank(
				body == null ? "" : str(body.get("reason")),
				"Rejected by admin"));
		claim.setUpdatedAt(Instant.now());
		InsuranceClaim saved = repo.save(claim);
		claimEvents.claimRejected(saved);
		return toMap(saved);
	}

	/** Legacy PATCH — routes known workflow statuses. */
	@Transactional
	public Map<String, Object> updateStatus(String id, Map<String, Object> body) {
		String status = str(body.get("status")).toLowerCase(Locale.ROOT);
		return switch (status) {
			case ClaimStatus.IN_REVIEW -> startReview(id);
			case ClaimStatus.APPROVED -> approveAndSettle(id, body);
			case ClaimStatus.REJECTED -> reject(id, body);
			default -> {
				if (!ADMIN_STATUSES.contains(status) && !ClaimStatus.SUBMITTED.equals(status)) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
				}
				InsuranceClaim claim = find(id);
				claim.setStatus(status);
				claim.setUpdatedAt(Instant.now());
				yield toMap(repo.save(claim));
			}
		};
	}

	private void validatePolicyLink(InsuranceClaim claim) {
		Map<String, Object> policy = policyClient.fetchPolicy(claim.getPolicyRef());
		policyClient.assertEligibleForClaim(policy);
		String policyReferenceHash = firstNonBlank(claim.getPolicyReferenceHash(), str(policy.get("policy_reference_hash")));
		Map<String, Object> canton = blockchainClient.verifyCantonPolicy(claim.getPolicyRef(), policyReferenceHash);
		blockchainClient.assertVerifiedOnCanton(canton, policy);
		claim.setPolicyReferenceHash(policyReferenceHash);
		claim.setCantonContractId(str(canton.get("contractId")));
		claim.setCustomerId(knownIdentity(firstNonBlank(claim.getCustomerId(), str(policy.get("customer_id")))));
		claim.setCustomerEmail(knownIdentity(firstNonBlank(claim.getCustomerEmail(), str(policy.get("customer_email")))));
	}

	private static String knownIdentity(String value) {
		if (value == null || value.isBlank()) {
			return "";
		}
		String normalized = value.trim().toLowerCase(Locale.ROOT);
		if (normalized.equals("unknown") || normalized.equals("n/a") || normalized.equals("-")) {
			return "";
		}
		return value.trim();
	}

	private static void assertTransition(InsuranceClaim claim, Set<String> allowedFrom) {
		if (ClaimStatus.isTerminal(claim.getStatus())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Claim already finalized: " + claim.getStatus());
		}
		if (!allowedFrom.contains(claim.getStatus())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Cannot transition from " + claim.getStatus() + " — refresh and try again");
		}
	}

	private InsuranceClaim find(String id) {
		return repo.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
	}

	private Map<String, Object> toMap(InsuranceClaim c) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", c.getId());
		map.put("policy_ref", c.getPolicyRef());
		map.put("customer_name", c.getCustomerName());
		map.put("customer_id", c.getCustomerId());
		map.put("customer_email", c.getCustomerEmail());
		map.put("policy_reference_hash", c.getPolicyReferenceHash());
		map.put("canton_contract_id", c.getCantonContractId());
		map.put("category", c.getCategory());
		map.put("status", c.getStatus());
		map.put("amount_claimed", c.getAmountClaimed());
		map.put("approved_amount", c.getApprovedAmount());
		map.put("description", c.getDescription());
		map.put("source", c.getSource());
		map.put("parametric_event_type", c.getParametricEventType());
		map.put("payout_transaction_id", c.getPayoutTransactionId());
		map.put("settlement_transaction_id", c.getSettlementTransactionId());
		map.put("rejection_reason", c.getRejectionReason());
		map.put("validation_notes", c.getValidationNotes());
		map.put("created_at", c.getCreatedAt().toString());
		map.put("updated_at", c.getUpdatedAt() == null ? null : c.getUpdatedAt().toString());
		List<Map<String, Object>> docs = claimDocuments.listForClaim(c.getId());
		map.put("documents", docs);
		map.put("document_count", docs.size());
		List<Map<String, Object>> queryList = claimQueries.listForClaim(c.getId());
		map.put("queries", queryList);
		map.put("open_query_count", claimQueries.countOpenForClaim(c.getId()));
		return map;
	}

	private static String extractTransactionId(Map<String, Object> walletResult) {
		Object tx = walletResult.get("transaction");
		if (tx instanceof Map<?, ?> txMap) {
			Object id = txMap.get("id");
			if (id != null) {
				return String.valueOf(id);
			}
		}
		return "";
	}

	private static Double optionalAmount(Object value) {
		try {
			return Double.parseDouble(String.valueOf(value));
		}
		catch (Exception ex) {
			return null;
		}
	}

	private static String appendNote(String existing, String note) {
		if (existing == null || existing.isBlank()) {
			return note;
		}
		return existing + " · " + note;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static double num(Object value, double fallback) {
		try {
			return Double.parseDouble(String.valueOf(value));
		}
		catch (Exception ex) {
			return fallback;
		}
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value.trim();
			}
		}
		return "";
	}
}
