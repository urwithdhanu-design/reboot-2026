package com.gcul.blockchain.web;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.blockchain.ledger.PolicyNftMintResult;
import com.gcul.blockchain.ledger.PolicyNftMintService;
import com.gcul.blockchain.ledger.LedgerAdapter;
import com.gcul.blockchain.ledger.LedgerAdapterRegistry;
import com.gcul.blockchain.messaging.PolicyMintService;
import com.gcul.blockchain.model.PolicyLedgerAttestation;
import com.gcul.blockchain.model.PolicyNftRecord;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/blockchain/internal/policy-nft")
public class PolicyNftController {

	private final PolicyNftMintService mintService;
	private final PolicyMintService policyMintService;
	private final LedgerAdapterRegistry ledgerRegistry;

	public PolicyNftController(
			PolicyNftMintService mintService,
			PolicyMintService policyMintService,
			LedgerAdapterRegistry ledgerRegistry) {
		this.mintService = mintService;
		this.policyMintService = policyMintService;
		this.ledgerRegistry = ledgerRegistry;
	}

	@GetMapping("/status")
	public Map<String, Object> status() {
		return mintService.status();
	}

	@GetMapping
	public Map<String, Object> list() {
		List<Map<String, Object>> items = mintService.recentMints().stream()
				.map(this::toResponse)
				.toList();
		return Map.of("records", items, "count", items.size());
	}

	@GetMapping("/{policyId}")
	public Map<String, Object> get(@PathVariable String policyId) {
		PolicyNftRecord record = mintService.findByPolicyId(policyId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mint record not found"));
		Map<String, Object> response = new LinkedHashMap<>(toResponse(record));
		List<Map<String, Object>> attestations = mintService.findAttestationsByPolicyId(policyId).stream()
				.map(this::toAttestationResponse)
				.toList();
		response.put("attestations", attestations);
		response.put("primaryLedger", ledgerRegistry.primaryLedgerId());
		return response;
	}

	/**
	 * On-ledger verification for the primary configured ledger.
	 * Claims verification should use the primary attestation in policy_ledger_attestations;
	 * secondary ledger mirrors are a Phase 2 concern.
	 */
	@GetMapping("/{policyId}/verify")
	public Map<String, Object> verify(
			@PathVariable String policyId,
			@org.springframework.web.bind.annotation.RequestParam String policyReferenceHash) {
		if (policyReferenceHash == null || policyReferenceHash.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policyReferenceHash is required");
		}
		LedgerAdapter adapter = ledgerRegistry.primaryAdapter();
		return adapter.verify(policyId, policyReferenceHash.trim())
				.orElseGet(() -> {
					Map<String, Object> offline = new LinkedHashMap<>();
					offline.put("policyId", policyId);
					offline.put("policyReferenceHash", policyReferenceHash.trim());
					offline.put("verified", false);
					offline.put("ledgerId", adapter.ledgerId());
					offline.put("reason", "Verification not available for ledger " + adapter.ledgerId());
					return offline;
				});
	}

	@PostMapping("/mint")
	public Map<String, Object> mint(@Valid @RequestBody MintPolicyRequest body) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("policyId", body.policyId());
		payload.put("policyNumber", body.policyNumber());
		payload.put("customerId", body.customerId());
		payload.put("walletAddress", body.walletAddress());
		payload.put("policyReferenceHash", body.policyReferenceHash());
		payload.put("metadataURI", body.metadataURI());
		payload.put("kycVerified", body.kycVerified());
		payload.put("policyEligible", body.policyEligible());
		if (body.metadata() != null) {
			payload.putAll(body.metadata());
		}
		PolicyNftMintResult result = policyMintService.mintFromApi(payload);
		return toMintResponse(result);
	}

	private Map<String, Object> toMintResponse(PolicyNftMintResult result) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("policyId", result.policyId());
		map.put("policyReferenceHash", result.policyReferenceHash());
		map.put("tokenId", result.tokenId());
		map.put("transactionHash", result.transactionHash());
		map.put("walletAddress", result.walletAddress());
		map.put("contractAddress", result.contractAddress());
		map.put("chainId", result.chainId());
		map.put("blockNumber", result.blockNumber());
		map.put("network", result.network());
		map.put("metadataURI", result.metadataUri());
		map.put("mode", result.mode());
		map.put("ledgerId", result.mode());
		map.put("mintStatus", result.mintStatus());
		return map;
	}

	private Map<String, Object> toResponse(PolicyNftRecord record) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("policyId", record.getPolicyId());
		map.put("policyReferenceHash", record.getPolicyReferenceHash());
		map.put("policyNumber", record.getPolicyNumber());
		map.put("customerId", record.getCustomerId());
		map.put("walletAddress", record.getWalletAddress());
		map.put("tokenId", record.getTokenId());
		map.put("transactionHash", record.getTransactionHash());
		map.put("contractAddress", record.getContractAddress());
		map.put("chainId", record.getChainId());
		map.put("blockNumber", record.getBlockNumber());
		map.put("network", record.getNetwork());
		map.put("metadataURI", record.getTokenUri());
		map.put("mode", record.getMintMode());
		map.put("ledgerId", record.getMintMode());
		map.put("mintStatus", record.getMintStatus());
		map.put("mintedAt", record.getMintedAt().toString());
		return map;
	}

	private Map<String, Object> toAttestationResponse(PolicyLedgerAttestation attestation) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("policyId", attestation.getPolicyId());
		map.put("ledgerId", attestation.getLedgerId());
		map.put("policyReferenceHash", attestation.getPolicyReferenceHash());
		map.put("tokenId", attestation.getTokenId());
		map.put("transactionHash", attestation.getTransactionHash());
		map.put("contractRef", attestation.getContractRef());
		map.put("chainId", attestation.getChainId());
		map.put("blockNumber", attestation.getBlockNumber());
		map.put("network", attestation.getNetwork());
		map.put("metadataURI", attestation.getMetadataUri());
		map.put("mintStatus", attestation.getMintStatus());
		map.put("mintedAt", attestation.getMintedAt().toString());
		map.put("explorerUrl", attestation.getExplorerUrl());
		return map;
	}

	public record MintPolicyRequest(
			@NotBlank String policyId,
			String policyNumber,
			String customerId,
			@NotBlank String walletAddress,
			@NotBlank String policyReferenceHash,
			String metadataURI,
			boolean kycVerified,
			boolean policyEligible,
			Map<String, Object> metadata) {
	}
}
