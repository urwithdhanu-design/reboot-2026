package com.gcul.blockchain.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.blockchain.chain.ChainLedger;
import com.gcul.blockchain.chain.ChainTransactionType;
import com.gcul.blockchain.chain.InsuranceChainService;
import com.gcul.blockchain.chain.InsuranceChainService.RecordTxRequest;

@RestController
@RequestMapping("/api/blockchain/chain")
public class InsuranceChainController {

	private final InsuranceChainService chain;

	public InsuranceChainController(InsuranceChainService chain) {
		this.chain = chain;
	}

	/** Linked-list view for admin visualization (genesis → tip). */
	@GetMapping
	public Map<String, Object> linkedList() {
		return chain.linkedListView();
	}

	@GetMapping("/network")
	public Map<String, Object> network() {
		return chain.networkInfo();
	}

	@GetMapping("/validate")
	public Map<String, Object> validate() {
		return chain.validateChain();
	}

	@GetMapping("/capabilities")
	public Map<String, Object> capabilities() {
		return Map.of("capabilities", chain.capabilities());
	}

	@GetMapping("/transactions")
	public Map<String, Object> chainTransactions() {
		return Map.of("transactions", chain.listTransactions(), "count", chain.listTransactions().size());
	}

	@PostMapping("/transactions")
	public Map<String, Object> append(@RequestBody Map<String, Object> body) {
		ChainTransactionType type = ChainTransactionType.valueOf(
				String.valueOf(body.getOrDefault("type", "AUDIT_RECORD")).toUpperCase());
		ChainLedger ledger = ChainLedger.valueOf(
				String.valueOf(body.getOrDefault("ledger", "AUDIT")).toUpperCase());
		@SuppressWarnings("unchecked")
		Map<String, Object> payload = (Map<String, Object>) body.getOrDefault("payload", body);
		var tx = chain.recordTransaction(new RecordTxRequest(
				type,
				ledger,
				payload,
				str(body.get("actor_id")),
				str(body.get("actor_role")),
				str(body.get("document_hash")),
				str(body.get("document_content"))));
		return Map.of("transaction", chain.transactionById(tx.getId()));
	}

	private static String str(Object v) {
		return v == null ? null : String.valueOf(v).trim();
	}
}
