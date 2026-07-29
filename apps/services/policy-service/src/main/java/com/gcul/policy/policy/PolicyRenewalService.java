package com.gcul.policy.policy;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.messaging.PolicyIssuanceService;
import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.repository.PolicyRecordRepository;

@Service
public class PolicyRenewalService {

	private final PolicyRecordService policyRecords;
	private final PolicyRecordRepository repository;
	private final PolicyIssuanceService issuance;

	public PolicyRenewalService(PolicyRecordService policyRecords, PolicyRecordRepository repository,
			PolicyIssuanceService issuance) {
		this.policyRecords = policyRecords;
		this.repository = repository;
		this.issuance = issuance;
	}

	public Map<String, Object> renewHomePolicy(String policyId, String userId, String email) {
		PolicyRecord source = policyRecords.findByPolicyId(policyId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found"));
		assertOwnedBy(source, userId, email);
		assertEligible(source);

		PolicyRecord renewal = createOrReuseRenewal(source, userId, email);
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("source_policy_id", source.getPolicyId());
		response.put("renewal", issuance.mintRenewalPolicy(renewal, userId, email));
		response.put("message", "Home Insurance renewed and submitted to the Canton policy ledger.");
		return response;
	}

	@Transactional
	protected PolicyRecord createOrReuseRenewal(PolicyRecord source, String authenticatedUserId, String authenticatedEmail) {
		var existing = repository.findFirstByRenewalOfPolicyIdOrderByRenewalSequenceDesc(source.getPolicyId());
		if (existing.isPresent()) {
			PolicyRecord record = existing.orElseThrow();
			if ("MINTED".equalsIgnoreCase(record.getMintStatus())) return record;
			alignCustomerIdentity(record, authenticatedUserId, authenticatedEmail);
			if ("FAILED".equalsIgnoreCase(record.getMintStatus())) return policyRecords.resetMintForRetry(record.getPolicyId());
			return policyRecords.save(record);
		}

		int sequence = 1;
		String policyId = "POL-RNW-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
		String policyNumber = source.getPolicyNumber() + "-R" + sequence;
		String quoteId = "RNW-" + source.getPolicyId() + "-" + sequence;
		Instant start = source.getCoverExpiresAt() != null && source.getCoverExpiresAt().isAfter(Instant.now())
				? source.getCoverExpiresAt() : Instant.now();

		PolicyRecord renewal = new PolicyRecord();
		renewal.setPolicyId(policyId);
		renewal.setPolicyNumber(policyNumber);
		renewal.setQuoteId(quoteId);
		renewal.setCustomerId(valueOr(authenticatedUserId, source.getCustomerId()));
		renewal.setCustomerEmail(valueOr(authenticatedEmail, source.getCustomerEmail()));
		renewal.setProductTitle(source.getProductTitle());
		renewal.setStatus("issued");
		renewal.setWalletAddress(source.getWalletAddress());
		renewal.setPolicyReferenceHash(PolicyReferenceHasher.hash(policyId, policyNumber, renewal.getCustomerId(), quoteId));
		renewal.setMetadataUri("ipfs://gcul-policy/" + policyId + "?renewalOf=" + source.getPolicyId());
		renewal.setMintStatus("PENDING");
		renewal.setIssuedAt(Instant.now());
		renewal.setProductCategory("Property");
		renewal.setCoverStartAt(start);
		renewal.setCoverExpiresAt(start.plus(365, ChronoUnit.DAYS));
		renewal.setCoverageLimitGbp(source.getCoverageLimitGbp());
		renewal.setCoverageUsedGbp(0.0);
		renewal.setCoverageSummary("Home Insurance renewal - " + valueOr(source.getCoverageSummary(), "same cover terms"));
		renewal.setCoverageDetailsJson(source.getCoverageDetailsJson());
		renewal.setRenewalOfPolicyId(source.getPolicyId());
		renewal.setRenewalSequence(sequence);
		renewal.setRenewedAt(Instant.now());
		return policyRecords.save(renewal);
	}

	private static void assertEligible(PolicyRecord policy) {
		if (policy.getProductTitle() == null
				|| !policy.getProductTitle().toLowerCase(java.util.Locale.ROOT).contains("home")
				|| !"Property".equalsIgnoreCase(PolicyCoverageResolver.normalizeProductCategory(
						policy.getProductCategory(), policy.getProductTitle()))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Online renewal is currently available only for Home Insurance policies");
		}
		if (!"MINTED".equalsIgnoreCase(policy.getMintStatus()) || "cancelled".equalsIgnoreCase(policy.getStatus())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Only an active Canton-minted Home Insurance policy can be renewed");
		}
		if (!StringUtils.hasText(policy.getWalletAddress())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Link a wallet before renewing this policy");
		}
	}

	private static void assertOwnedBy(PolicyRecord policy, String userId, String email) {
		boolean owned = StringUtils.hasText(userId) && userId.trim().equals(policy.getCustomerId());
		owned = owned || (StringUtils.hasText(email) && email.trim().equalsIgnoreCase(policy.getCustomerEmail()));
		if (!owned) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot renew this policy");
	}

	private static String valueOr(String value, String fallback) {
		return StringUtils.hasText(value) ? value : fallback;
	}

	private static void alignCustomerIdentity(PolicyRecord renewal, String authenticatedUserId, String authenticatedEmail) {
		if (StringUtils.hasText(authenticatedUserId)) renewal.setCustomerId(authenticatedUserId.trim());
		if (StringUtils.hasText(authenticatedEmail)) renewal.setCustomerEmail(authenticatedEmail.trim().toLowerCase(java.util.Locale.ROOT));
	}
}
