package com.gcul.blockchain.canton;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.gcul.blockchain.ledger.LedgerMode;
import com.gcul.blockchain.model.PolicyNftRecord;
import com.gcul.blockchain.repository.PolicyNftRecordRepository;

@Service
public class LedgerReconciliationService {

	private final PolicyNftRecordRepository policyNftRecordRepository;
	private final CantonPolicyMintService cantonPolicyMintService;

	public LedgerReconciliationService(
			PolicyNftRecordRepository policyNftRecordRepository,
			CantonPolicyMintService cantonPolicyMintService) {
		this.policyNftRecordRepository = policyNftRecordRepository;
		this.cantonPolicyMintService = cantonPolicyMintService;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> runReport() {
		Instant generatedAt = Instant.now();
		List<PolicyNftRecord> records = policyNftRecordRepository.findAll();
		List<Map<String, Object>> drifts = new ArrayList<>();
		int cantonRecords = 0;
		int verifiedOnLedger = 0;

		for (PolicyNftRecord record : records) {
			if (!"MINTED".equalsIgnoreCase(record.getMintStatus())) {
				continue;
			}
			String ledgerMode = StringUtils.hasText(record.getMintMode())
					? record.getMintMode().trim().toLowerCase()
					: LedgerMode.SIMULATED.id();
			if (!"canton".equals(ledgerMode)) {
				continue;
			}
			cantonRecords++;
			boolean verified = false;
			String reason = "";
			if (cantonPolicyMintService.isActive()) {
				Optional<String> contractId = cantonPolicyMintService.verifyPolicyContract(record.getPolicyReferenceHash());
				verified = contractId.isPresent();
				if (!verified) {
					reason = "Canton query returned no InsurancePolicy contract for policyReferenceHash";
				}
			}
			else {
				reason = "Canton ledger offline — cannot verify on-ledger state";
			}
			if (verified) {
				verifiedOnLedger++;
			}
			else {
				drifts.add(driftRow(record, reason));
			}
		}

		Map<String, Object> report = new LinkedHashMap<>();
		report.put("generatedAt", generatedAt.toString());
		report.put("cantonLive", cantonPolicyMintService.isActive());
		report.put("totalMintedRecords", records.stream()
				.filter(r -> "MINTED".equalsIgnoreCase(r.getMintStatus()))
				.count());
		report.put("cantonMintedRecords", cantonRecords);
		report.put("verifiedOnLedger", verifiedOnLedger);
		report.put("driftCount", drifts.size());
		report.put("drifts", drifts);
		report.put("status", drifts.isEmpty() ? "ok" : "drift_detected");
		return report;
	}

	private static Map<String, Object> driftRow(PolicyNftRecord record, String reason) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("policyId", record.getPolicyId());
		row.put("policyReferenceHash", record.getPolicyReferenceHash());
		row.put("tokenId", record.getTokenId());
		row.put("ledgerMode", record.getMintMode());
		row.put("mintedAt", record.getMintedAt() == null ? null : record.getMintedAt().toString());
		row.put("reason", reason);
		return row;
	}
}
