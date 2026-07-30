package com.gcul.blockchain.canton;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.gcul.blockchain.ledger.PolicyNftMintResult;
import com.gcul.blockchain.model.CantonCommandRecord;
import com.gcul.blockchain.repository.CantonCommandRecordRepository;

@ExtendWith(MockitoExtension.class)
class IdempotentCommandStoreTest {

	@Mock
	private CantonCommandRecordRepository repository;

	private IdempotentCommandStore store;

	@BeforeEach
	void setUp() {
		store = new IdempotentCommandStore(repository);
	}

	@Test
	void mintBusinessKeySanitizesPolicyId() {
		assertEquals("mint:policy:POL-001", store.mintBusinessKey("POL-001"));
		assertEquals("mint:policy:POL-001", store.mintBusinessKey("POL/001"));
	}

	@Test
	void findCompletedMintMapsStoredRecord() {
		CantonCommandRecord record = new CantonCommandRecord();
		record.setPolicyId("POL-99");
		record.setTokenId("#cid:99");
		record.setTransactionHash("upd-99");
		record.setLedgerMode("canton");
		when(repository.findByPolicyIdAndCommandType("POL-99", IdempotentCommandStore.COMMAND_TYPE_POLICY_MINT))
				.thenReturn(Optional.of(record));

		Optional<PolicyNftMintResult> result = store.findCompletedMint("POL-99");
		assertTrue(result.isPresent());
		assertEquals("#cid:99", result.get().tokenId());
		assertEquals("canton", result.get().ledgerMode());
	}

	@Test
	void recordMintPersistsCommand() {
		PolicyNftMintResult mint = new PolicyNftMintResult(
				"POL-50",
				"h",
				"#cid:50",
				"upd-50",
				"0x",
				"t",
				0L,
				1L,
				"net",
				"uri",
				"canton",
				"MINTED",
				"canton",
				"pkg");
		when(repository.findById("mint:policy:POL-50")).thenReturn(Optional.empty());

		store.recordMint("POL-50", mint);
		verify(repository).save(any(CantonCommandRecord.class));
	}
}
