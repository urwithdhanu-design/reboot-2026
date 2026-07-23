package com.gcul.blockchain.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.blockchain.chain.ChainLedger;
import com.gcul.blockchain.chain.ChainTransactionType;
import com.gcul.blockchain.chain.InsuranceChainService;
import com.gcul.blockchain.chain.InsuranceChainService.RecordTxRequest;
import com.gcul.blockchain.gcul.GculSidecarClient;
import com.gcul.blockchain.model.LedgerTransaction;
import com.gcul.blockchain.repository.LedgerTransactionRepository;

@Service
public class BlockchainOrchestratorService {

	private final LedgerTransactionRepository repo;
	private final GculSidecarClient gcul;
	private final InsuranceChainService insuranceChain;

	public BlockchainOrchestratorService(
			LedgerTransactionRepository repo,
			GculSidecarClient gcul,
			InsuranceChainService insuranceChain) {
		this.repo = repo;
		this.gcul = gcul;
		this.insuranceChain = insuranceChain;
	}

	public Map<String, Object> submit(Map<String, Object> body) {
		String type = firstNonBlank(str(body.get("type")), "transfer");
		String from = firstNonBlank(str(body.get("from_wallet")), "gcul:treasury");
		String to = str(body.get("to_wallet"));
		if (to.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "to_wallet is required");
		}

		Map<String, Object> sidecarPayload = new LinkedHashMap<>();
		sidecarPayload.put("from_wallet", from);
		sidecarPayload.put("to_wallet", to);
		sidecarPayload.put("amount", num(body.get("amount"), 0));
		sidecarPayload.put("asset", firstNonBlank(str(body.get("asset")), "GBP"));
		sidecarPayload.put("reference", firstNonBlank(str(body.get("reference")), type));
		sidecarPayload.put("type", type);

		Map<String, Object> ledgerResult = Map.of();
		String status = "confirmed";
		String externalDigest = null;
		try {
			ledgerResult = gcul.transfer(sidecarPayload);
			Object digest = ledgerResult.get("digest");
			if (digest != null) {
				externalDigest = String.valueOf(digest);
			}
			Object remoteStatus = ledgerResult.get("status");
			if (remoteStatus != null && !String.valueOf(remoteStatus).isBlank()) {
				status = String.valueOf(remoteStatus);
			}
		}
		catch (Exception ex) {
			// Keep local audit trail even if sidecar is down
			status = "local_only";
			ledgerResult = Map.of(
					"mode", "fallback",
					"status", "local_only",
					"error", ex.getMessage() == null ? "sidecar unavailable" : ex.getMessage());
		}

		LedgerTransaction tx = new LedgerTransaction();
		tx.setId("TX-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase(Locale.ROOT));
		tx.setType(type);
		tx.setFromWallet(from);
		tx.setToWallet(to);
		tx.setAmount(num(body.get("amount"), 0));
		tx.setAsset(firstNonBlank(str(body.get("asset")), "GBP"));
		tx.setStatus(status);
		String reference = firstNonBlank(str(body.get("reference")), type);
		if (externalDigest != null) {
			reference = reference + " · digest=" + externalDigest.substring(0, Math.min(12, externalDigest.length()));
		}
		tx.setReference(reference);
		tx.setCreatedAt(Instant.now());

		Map<String, Object> saved = toMap(repo.save(tx));
		saved.put("gcul", ledgerResult);
		if (externalDigest != null) {
			saved.put("digest", externalDigest);
		}

		ChainLedger ledger = type.contains("claim") ? ChainLedger.CLAIMS : ChainLedger.WORKFLOW;
		ChainTransactionType chainType = type.contains("claim")
				? ChainTransactionType.CLAIM_SETTLED
				: ChainTransactionType.SETTLEMENT;
		insuranceChain.recordTransaction(new RecordTxRequest(
				chainType,
				ledger,
				saved,
				to,
				"wallet",
				externalDigest,
				null));

		return saved;
	}

	public List<Map<String, Object>> list() {
		return repo.findAllByOrderByCreatedAtDesc().stream().map(this::toMap).toList();
	}

	public Map<String, Object> get(String id) {
		return toMap(repo.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found")));
	}

	public Map<String, Object> settleClaim(Map<String, Object> body) {
		Map<String, Object> payload = new LinkedHashMap<>(body);
		payload.putIfAbsent("type", "claim_settlement");
		payload.putIfAbsent("from_wallet", "gcul:claims-pool");
		payload.putIfAbsent("reference", str(body.get("claim_id")));
		return submit(payload);
	}

	public Map<String, Object> sidecarHealth() {
		return gcul.health();
	}

	private Map<String, Object> toMap(LedgerTransaction tx) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", tx.getId());
		map.put("type", tx.getType());
		map.put("from_wallet", tx.getFromWallet());
		map.put("to_wallet", tx.getToWallet());
		map.put("amount", tx.getAmount());
		map.put("asset", tx.getAsset());
		map.put("status", tx.getStatus());
		map.put("reference", tx.getReference());
		map.put("created_at", tx.getCreatedAt().toString());
		return map;
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
				return value;
			}
		}
		return "";
	}
}
