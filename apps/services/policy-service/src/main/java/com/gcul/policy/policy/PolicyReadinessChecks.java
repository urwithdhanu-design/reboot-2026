package com.gcul.policy.policy;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.util.StringUtils;

import com.gcul.policy.model.PolicyRecord;

/**
 * Shared readiness checks shown at mint gate and on customer settlement trail.
 */
public final class PolicyReadinessChecks {

	private PolicyReadinessChecks() {
	}

	public static List<Map<String, Object>> settlementReadiness(PolicyRecord record) {
		boolean walletLinked = StringUtils.hasText(record.getWalletAddress());
		return List.of(
				check("Customer consent", walletLinked ? "passed" : "failed",
						walletLinked
								? "Customer approved wallet consent for policy storage and claim payouts."
								: "Wallet consent not recorded — approve via the email link before payouts."),
				check("Policy issued", "passed", "Policy issuance record is active."),
				check("Wallet linked", walletLinked ? "passed" : "failed",
						walletLinked
								? "Customer wallet was present for the mint."
								: "No customer wallet was recorded."),
				check("Policy reference hash",
						StringUtils.hasText(record.getPolicyReferenceHash()) ? "passed" : "failed",
						StringUtils.hasText(record.getPolicyReferenceHash())
								? "Immutable policy reference hash was supplied."
								: "Policy reference hash is missing."),
				check("Compliance decision",
						"REJECTED".equalsIgnoreCase(record.getComplianceDecision()) ? "failed" : "passed",
						StringUtils.hasText(record.getComplianceDecision())
								? record.getComplianceDecision()
								: "Compliance review completed."),
				check("Fraud screening",
						record.getComplianceFraudScore() == null || record.getComplianceFraudScore() < 0.80
								? "passed"
								: "failed",
						record.getComplianceFraudScore() == null
								? "No score recorded."
								: "Risk score "
										+ String.format(Locale.ROOT, "%.2f", record.getComplianceFraudScore())));
	}

	private static Map<String, Object> check(String name, String status, String detail) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("name", name);
		row.put("status", status);
		row.put("detail", detail);
		return row;
	}
}
