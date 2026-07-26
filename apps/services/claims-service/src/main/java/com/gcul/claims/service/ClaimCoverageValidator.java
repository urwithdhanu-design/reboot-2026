package com.gcul.claims.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.claims.repository.ClaimRepository;

@Service
public class ClaimCoverageValidator {

	private static final List<String> RESERVING_STATUSES = List.of(
			"submitted",
			"pending_approval",
			"in_review",
			"awaiting_customer",
			"approved",
			"payment_pending",
			"paid_out",
			"settled",
			"paid");

	private final ClaimRepository claims;

	public ClaimCoverageValidator(ClaimRepository claims) {
		this.claims = claims;
	}

	public void assertClaimAllowed(Map<String, Object> policy, String claimCategory, double amountClaimed) {
		assertClaimAllowed(policy, claimCategory, amountClaimed, false);
	}

	public void assertClaimAllowed(Map<String, Object> policy, String claimCategory, double amountClaimed, boolean parametric) {
		assertCoverageActive(policy);
		if (!parametric) {
			assertCategoryMatches(policy, claimCategory);
		}
		assertWithinCoverageLimit(policy, amountClaimed, null);
	}

	public double resolveApprovedAmount(Map<String, Object> policy, String policyRef, double requestedAmount) {
		Double limit = policyLimit(policy);
		if (limit == null || limit <= 0) {
			return requestedAmount;
		}
		double reserved = claims.sumReservedAmountForPolicy(policyRef, RESERVING_STATUSES);
		double remaining = Math.max(0, limit - reserved);
		if (requestedAmount > remaining) {
			if (remaining <= 0) {
				throw new ResponseStatusException(HttpStatus.CONFLICT,
						String.format(Locale.ROOT,
								"Policy coverage limit of £%,.2f is fully used — cannot approve further claims",
								limit));
			}
			return remaining;
		}
		return requestedAmount;
	}

	private void assertCoverageActive(Map<String, Object> policy) {
		String start = str(policy.get("cover_start_at"));
		if (start.isBlank()) {
			start = str(policy.get("activated_at"));
		}
		if (start.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Policy cover has not started — cover begins when the policy is minted and approved");
		}
		try {
			if (Instant.now().isBefore(Instant.parse(start))) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Policy cover has not started yet — effective from " + start);
			}
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (Exception ignored) {
			// skip invalid date
		}

		String expires = str(policy.get("cover_expires_at"));
		if (!expires.isBlank()) {
			try {
				if (Instant.now().isAfter(Instant.parse(expires))) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"Policy coverage expired on " + expires);
				}
			}
			catch (ResponseStatusException ex) {
				throw ex;
			}
			catch (Exception ignored) {
				// skip invalid date
			}
		}
		else if (Boolean.TRUE.equals(policy.get("coverage_expired"))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Policy coverage has expired");
		}
	}

	private void assertCategoryMatches(Map<String, Object> policy, String claimCategory) {
		String policyCategory = PolicyCategoryNormalizer.normalize(
				str(policy.get("product_category")),
				str(policy.get("product_title")));
		if (policyCategory.isBlank()) {
			return;
		}
		String claim = claimCategory.isBlank() ? "General" : claimCategory.trim();
		if (PolicyCategoryNormalizer.compatible(policyCategory, claim)) {
			return;
		}
		throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
				"Claim category '" + claim + "' does not match policy cover type '" + policyCategory + "'");
	}

	private void assertWithinCoverageLimit(Map<String, Object> policy, double amountClaimed, String excludeClaimId) {
		Double limit = policyLimit(policy);
		if (limit == null || limit <= 0) {
			return;
		}
		if (amountClaimed > limit) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					String.format(Locale.ROOT,
							"Claim amount £%,.2f exceeds policy coverage limit of £%,.2f",
							amountClaimed,
							limit));
		}
		String policyRef = str(policy.get("policy_id"));
		if (policyRef.isBlank()) {
			policyRef = str(policy.get("policy_ref"));
		}
		if (policyRef.isBlank()) {
			return;
		}
		double reserved = claims.sumReservedAmountForPolicy(policyRef, RESERVING_STATUSES);
		if (excludeClaimId != null && !excludeClaimId.isBlank()) {
			reserved -= claims.findById(excludeClaimId)
					.map(c -> c.getApprovedAmount() != null ? c.getApprovedAmount() : c.getAmountClaimed())
					.orElse(0.0);
		}
		double remaining = limit - reserved;
		if (amountClaimed > remaining) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					String.format(Locale.ROOT,
							"Claim amount £%,.2f exceeds remaining policy coverage of £%,.2f (limit £%,.2f)",
							amountClaimed,
							Math.max(0, remaining),
							limit));
		}
	}

	private static boolean categoriesCompatible(String policyCategory, String claimCategory) {
		return PolicyCategoryNormalizer.compatible(policyCategory, claimCategory);
	}

	private static Double policyLimit(Map<String, Object> policy) {
		Object raw = policy.get("coverage_limit_gbp");
		if (raw instanceof Number number) {
			return number.doubleValue();
		}
		try {
			String text = str(raw);
			return text.isBlank() ? null : Double.parseDouble(text);
		}
		catch (Exception ex) {
			return null;
		}
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
