package com.gcul.blockchain.chain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gcul.blockchain.model.ChainBlock;
import com.gcul.blockchain.model.ChainTransaction;
import com.gcul.blockchain.repository.ChainBlockRepository;
import com.gcul.blockchain.repository.ChainTransactionRepository;

@Service
public class InsuranceChainService {

	public static final String NETWORK_NAME = "GCUL Insurance Chain";
	public static final long CHAIN_ID = 2026L;

	private final ChainBlockRepository blocks;
	private final ChainTransactionRepository transactions;
	private final ChainFraudScorer fraudScorer;
	private final ObjectMapper objectMapper;
	private final ChainValidatorSigner signer;
	private final List<String> peerNodes;

	public InsuranceChainService(
			ChainBlockRepository blocks,
			ChainTransactionRepository transactions,
			ChainFraudScorer fraudScorer,
			ObjectMapper objectMapper,
			ChainValidatorSigner signer,
			@Value("${gcul.chain.peers:gcul-policy,gcul-claims,gcul-kyc,gcul-blockchain-orchestrator}") String peersCsv) {
		this.blocks = blocks;
		this.transactions = transactions;
		this.fraudScorer = fraudScorer;
		this.objectMapper = objectMapper;
		this.signer = signer;
		this.peerNodes = List.of(peersCsv.split(","));
	}

	@Transactional
	public void ensureGenesis() {
		if (blocks.count() > 0) {
			return;
		}
		ChainBlock genesis = new ChainBlock();
		genesis.setHeight(0);
		genesis.setPreviousHash("0".repeat(64));
		genesis.setMerkleRoot(ChainCrypto.sha256Hex("genesis"));
		genesis.setTransactionCount(0);
		genesis.setMinedAt(Instant.now());
		genesis.setValidatorId(signer.validatorId());
		String body = blockCanonical(genesis);
		genesis.setHash(ChainCrypto.sha256Hex(body));
		genesis.setValidatorSignature(signer.sign(genesis.getHash()));
		blocks.save(genesis);
	}

	@Transactional
	public ChainTransaction recordTransaction(RecordTxRequest request) {
		ensureGenesis();
		String payloadJson = toJson(request.payload());
		String docHash = request.documentHash();
		if (docHash == null && request.documentContent() != null) {
			docHash = ChainCrypto.sha256Hex(request.documentContent());
		}

		ChainTransaction tx = new ChainTransaction();
		tx.setId(UUID.randomUUID().toString());
		tx.setType(request.type().name());
		tx.setLedger(request.ledger().name());
		tx.setPayloadJson(payloadJson);
		tx.setDocumentHash(docHash);
		tx.setActorId(request.actorId());
		tx.setActorRole(request.actorRole());
		tx.setFraudScore(fraudScorer.score(request.type().name(), payloadJson, request.actorRole()));
		tx.setCreatedAt(Instant.now());

		String txCanonical = txCanonical(tx);
		tx.setTxHash(ChainCrypto.sha256Hex(txCanonical));
		tx.setPublicKeyBase64("validator:" + signer.validatorId());
		tx.setSignatureBase64(signer.sign(tx.getTxHash()));

		transactions.save(tx);
		minePendingTransactions();
		return tx;
	}

	@Transactional
	public void minePendingTransactions() {
		List<ChainTransaction> pending = transactions.findByBlockHeightIsNullOrderByCreatedAtAsc();
		if (pending.isEmpty()) {
			return;
		}
		ChainBlock prev = blocks.findTopByOrderByHeightDesc()
				.orElseThrow(() -> new IllegalStateException("genesis missing"));
		long height = prev.getHeight() + 1;

		List<String> leaves = pending.stream().map(ChainTransaction::getTxHash).toList();
		ChainBlock block = new ChainBlock();
		block.setHeight(height);
		block.setPreviousHash(prev.getHash());
		block.setMerkleRoot(ChainCrypto.merkleRoot(leaves));
		block.setTransactionCount(pending.size());
		block.setMinedAt(Instant.now());
		block.setValidatorId(signer.validatorId());
		String body = blockCanonical(block);
		block.setHash(ChainCrypto.sha256Hex(body));
		block.setValidatorSignature(signer.sign(block.getHash()));
		blocks.save(block);

		for (ChainTransaction tx : pending) {
			tx.setBlockHeight(height);
		}
		transactions.saveAll(pending);
	}

	@Transactional(readOnly = true)
	public Map<String, Object> validateChain() {
		List<ChainBlock> chain = blocks.findAllByOrderByHeightAsc();
		List<String> errors = new ArrayList<>();
		String expectedPrev = null;
		for (ChainBlock block : chain) {
			if (block.getHeight() == 0) {
				if (!"0".repeat(64).equals(block.getPreviousHash())) {
					errors.add("genesis previousHash invalid");
				}
			}
			else if (expectedPrev != null && !expectedPrev.equals(block.getPreviousHash())) {
				errors.add("break at height " + block.getHeight());
			}
			String recomputed = ChainCrypto.sha256Hex(blockCanonical(block));
			if (!recomputed.equals(block.getHash())) {
				errors.add("hash mismatch height " + block.getHeight());
			}
			if (!signer.verify(block.getHash(), block.getValidatorSignature())) {
				errors.add("validator signature invalid height " + block.getHeight());
			}
			expectedPrev = block.getHash();
		}
		return Map.of(
				"valid", errors.isEmpty(),
				"block_count", chain.size(),
				"errors", errors);
	}

	@Transactional(readOnly = true)
	public Map<String, Object> networkInfo() {
		long height = blocks.findTopByOrderByHeightDesc().map(ChainBlock::getHeight).orElse(0L);
		long txCount = transactions.count();
		return Map.of(
				"network_name", NETWORK_NAME,
				"chain_id", CHAIN_ID,
				"consensus", "proof_of_authority",
				"hash_algorithm", "SHA-256",
				"signature_algorithm", "HMAC-SHA256 (validator PoA)",
				"block_height", height,
				"transaction_count", txCount,
				"validator_id", signer.validatorId(),
				"peers", peerNodes);
	}

	@Transactional(readOnly = true)
	public Map<String, Object> linkedListView() {
		List<ChainBlock> chain = blocks.findAllByOrderByHeightAsc();
		List<Map<String, Object>> nodes = new ArrayList<>();
		for (ChainBlock block : chain) {
			List<ChainTransaction> txs = transactions.findByBlockHeightOrderByCreatedAtAsc(block.getHeight());
			Map<String, Object> node = new LinkedHashMap<>();
			node.put("height", block.getHeight());
			node.put("hash", block.getHash());
			node.put("previous_hash", block.getPreviousHash());
			node.put("merkle_root", block.getMerkleRoot());
			node.put("transaction_count", block.getTransactionCount());
			node.put("mined_at", block.getMinedAt().toString());
			node.put("validator_id", block.getValidatorId());
			node.put("transactions", txs.stream().map(this::txToMap).toList());
			nodes.add(node);
		}
		return Map.of(
				"network", networkInfo(),
				"validation", validateChain(),
				"blocks", nodes);
	}

	@Transactional(readOnly = true)
	public Map<String, Object> transactionById(String id) {
		return transactions.findById(id)
				.map(this::txToMap)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "transaction not found"));
	}

	@Transactional(readOnly = true)
	public List<Map<String, Object>> listTransactions() {
		return transactions.findAll().stream()
				.sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
				.map(this::txToMap)
				.toList();
	}

	public Map<String, Object> capabilities() {
		Map<String, Object> caps = new LinkedHashMap<>();
		caps.put("peer_to_peer", Map.of("description", "Service mesh peers replicate chain read models", "peers", peerNodes));
		caps.put("ledgers", List.of(ChainLedger.values()));
		caps.put("transaction_types", List.of(ChainTransactionType.values()));
		caps.put("identity_management", true);
		caps.put("document_hash_verification", true);
		caps.put("role_based_permissions", true);
		caps.put("audit_logging", true);
		caps.put("smart_contract_workflows", true);
		caps.put("ai_fraud_scoring", true);
		return caps;
	}

	private Map<String, Object> txToMap(ChainTransaction tx) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", tx.getId());
		map.put("block_height", tx.getBlockHeight());
		map.put("type", tx.getType());
		map.put("ledger", tx.getLedger());
		map.put("payload", tx.getPayloadJson());
		map.put("document_hash", tx.getDocumentHash());
		map.put("actor_id", tx.getActorId());
		map.put("actor_role", tx.getActorRole());
		map.put("fraud_score", tx.getFraudScore());
		map.put("tx_hash", tx.getTxHash());
		map.put("signature", tx.getSignatureBase64());
		map.put("public_key", tx.getPublicKeyBase64());
		map.put("created_at", tx.getCreatedAt().toString());
		return map;
	}

	private String blockCanonical(ChainBlock block) {
		return block.getHeight() + "|" + block.getPreviousHash() + "|" + block.getMerkleRoot() + "|"
				+ block.getTransactionCount() + "|" + block.getValidatorId() + "|" + block.getMinedAt().toEpochMilli();
	}

	private String txCanonical(ChainTransaction tx) {
		return tx.getType() + "|" + tx.getLedger() + "|" + tx.getPayloadJson() + "|"
				+ (tx.getDocumentHash() == null ? "" : tx.getDocumentHash()) + "|"
				+ (tx.getActorId() == null ? "" : tx.getActorId());
	}

	private String toJson(Map<String, Object> payload) {
		try {
			return objectMapper.writeValueAsString(payload == null ? Map.of() : payload);
		}
		catch (JsonProcessingException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payload");
		}
	}

	public record RecordTxRequest(
			ChainTransactionType type,
			ChainLedger ledger,
			Map<String, Object> payload,
			String actorId,
			String actorRole,
			String documentHash,
			String documentContent) {
	}
}
