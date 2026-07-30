package com.gcul.blockchain.canton;

import java.time.Instant;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.gcul.blockchain.ledger.PolicyNftMintResult;
import com.gcul.blockchain.model.CantonCommandRecord;
import com.gcul.blockchain.repository.CantonCommandRecordRepository;

@Service
public class IdempotentCommandStore {

	public static final String COMMAND_TYPE_POLICY_MINT = "POLICY_MINT";

	private final CantonCommandRecordRepository repository;

	public IdempotentCommandStore(CantonCommandRecordRepository repository) {
		this.repository = repository;
	}

	public String mintBusinessKey(String policyId) {
		return "mint:policy:" + sanitize(policyId);
	}

	public String mintCommandId(String policyId) {
		return "gcul-mint-" + sanitize(policyId);
	}

	public Optional<PolicyNftMintResult> findCompletedMint(String policyId) {
		return repository.findByPolicyIdAndCommandType(policyId, COMMAND_TYPE_POLICY_MINT)
				.map(this::toMintResult);
	}

	@Transactional
	public void recordMint(String policyId, PolicyNftMintResult result) {
		if (!StringUtils.hasText(policyId) || result == null) {
			return;
		}
		String businessKey = mintBusinessKey(policyId);
		CantonCommandRecord record = repository.findById(businessKey).orElseGet(CantonCommandRecord::new);
		record.setBusinessKey(businessKey);
		record.setCommandType(COMMAND_TYPE_POLICY_MINT);
		record.setCommandId(mintCommandId(policyId));
		record.setPolicyId(policyId);
		record.setTokenId(result.tokenId());
		record.setTransactionHash(result.transactionHash());
		record.setLedgerMode(result.ledgerMode());
		record.setCompletedAt(Instant.now());
		repository.save(record);
	}

	private PolicyNftMintResult toMintResult(CantonCommandRecord record) {
		String mode = StringUtils.hasText(record.getLedgerMode()) ? record.getLedgerMode() : "canton";
		return new PolicyNftMintResult(
				record.getPolicyId(),
				"",
				record.getTokenId(),
				record.getTransactionHash(),
				"",
				"",
				0L,
				0L,
				"",
				"",
				mode,
				"MINTED",
				mode,
				"");
	}

	private static String sanitize(String policyId) {
		return policyId.replaceAll("[^A-Za-z0-9_-]", "-");
	}
}
