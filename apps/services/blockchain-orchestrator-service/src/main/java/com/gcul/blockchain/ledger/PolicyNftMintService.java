package com.gcul.blockchain.ledger;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.blockchain.canton.IdempotentCommandStore;
import com.gcul.blockchain.ledger.PolicyMintValidator.MintContext;
import com.gcul.blockchain.model.PolicyLedgerAttestation;
import com.gcul.blockchain.model.PolicyNftRecord;
import com.gcul.blockchain.repository.PolicyLedgerAttestationRepository;
import com.gcul.blockchain.repository.PolicyNftRecordRepository;

@Service
public class PolicyNftMintService {

	private final PolicyNftRecordRepository repository;
	private final PolicyLedgerAttestationRepository attestationRepository;
	private final PolicyMintValidator validator;
	private final LedgerAdapterRegistry ledgerRegistry;
	private final IdempotentCommandStore idempotentCommandStore;

	public PolicyNftMintService(
			PolicyNftRecordRepository repository,
			PolicyLedgerAttestationRepository attestationRepository,
			PolicyMintValidator validator,
			LedgerAdapterRegistry ledgerRegistry,
			IdempotentCommandStore idempotentCommandStore) {
		this.repository = repository;
		this.attestationRepository = attestationRepository;
		this.validator = validator;
		this.ledgerRegistry = ledgerRegistry;
		this.idempotentCommandStore = idempotentCommandStore;
	}

	public Map<String, Object> status() {
		Map<String, Object> status = new LinkedHashMap<>(ledgerRegistry.mintAdapterStatus());
		status.put("adapters", ledgerRegistry.allStatus().get("adapters"));
		return status;
	}

	@Transactional
	public PolicyNftMintResult mintPolicyNft(MintRequest request) {
		String policyId = requireText(request.policyId(), "policyId");
		Optional<PolicyNftMintResult> existing = findExistingMint(policyId);
		if (existing.isPresent()) {
			return existing.get();
		}

		String policyReferenceHash = requireText(request.policyReferenceHash(), "policyReferenceHash");
		String walletAddress = WalletAddressValidator.normalize(request.walletAddress());
		String metadataUri = requireText(
				StringUtils.hasText(request.metadataUri()) ? request.metadataUri() : buildMetadataUri(policyId),
				"metadataURI");
		String policyNumber = firstNonBlank(request.policyNumber(), policyId);
		String customerId = firstNonBlank(request.customerId(), "unknown");

		LedgerAdapter adapter = ledgerRegistry.resolveMintAdapter();
		validator.validate(new MintContext(
				policyId,
				policyReferenceHash,
				walletAddress,
				metadataUri,
				customerId,
				request.kycVerified(),
				request.policyEligible(),
				adapter.ledgerId()));

		PolicyNftMintResult result = adapter.mint(new MintRequest(
				policyId,
				policyNumber,
				customerId,
				walletAddress,
				policyReferenceHash,
				metadataUri,
				request.kycVerified(),
				request.policyEligible(),
				request.metadata()));

		idempotentCommandStore.recordMint(policyId, result);
		saveAttestation(result, adapter.ledgerId(), policyNumber, customerId);
		saveLegacyRecord(result, policyNumber, customerId);
		return result;
	}

	private Optional<PolicyNftMintResult> findExistingMint(String policyId) {
		Optional<PolicyNftMintResult> fromRecord = repository.findByPolicyId(policyId).map(this::toMintResult);
		if (fromRecord.isPresent()) {
			return fromRecord;
		}
		return idempotentCommandStore.findCompletedMint(policyId);
	}

	private PolicyNftMintResult toMintResult(PolicyNftRecord record) {
		return new PolicyNftMintResult(
				record.getPolicyId(),
				record.getPolicyReferenceHash(),
				record.getTokenId(),
				record.getTransactionHash(),
				record.getWalletAddress(),
				record.getContractAddress(),
				record.getChainId(),
				record.getBlockNumber(),
				record.getNetwork(),
				record.getTokenUri(),
				record.getMintMode(),
				record.getMintStatus(),
				record.getMintMode(),
				"");
	}

	public List<PolicyNftRecord> recentMints() {
		return repository.findTop20ByOrderByMintedAtDesc();
	}

	public Optional<PolicyNftRecord> findByPolicyId(String policyId) {
		return repository.findByPolicyId(policyId);
	}

	public List<PolicyLedgerAttestation> findAttestationsByPolicyId(String policyId) {
		return attestationRepository.findByPolicyIdOrderByMintedAtDesc(policyId);
	}

	public Optional<PolicyLedgerAttestation> findPrimaryAttestation(String policyId) {
		return attestationRepository.findByPolicyIdAndLedgerId(policyId, ledgerRegistry.primaryLedgerId())
				.or(() -> attestationRepository.findByPolicyIdOrderByMintedAtDesc(policyId).stream().findFirst());
	}

	private void saveAttestation(
			PolicyNftMintResult result,
			String ledgerId,
			String policyNumber,
			String customerId) {
		PolicyLedgerAttestation attestation = new PolicyLedgerAttestation();
		attestation.setPolicyId(result.policyId());
		attestation.setLedgerId(ledgerId);
		attestation.setPolicyReferenceHash(result.policyReferenceHash());
		attestation.setPolicyNumber(policyNumber);
		attestation.setCustomerId(customerId);
		attestation.setWalletAddress(result.walletAddress());
		attestation.setTokenId(result.tokenId());
		attestation.setTransactionHash(result.transactionHash());
		attestation.setContractRef(result.contractAddress());
		attestation.setChainId(result.chainId());
		attestation.setNetwork(result.network());
		attestation.setMetadataUri(result.metadataUri());
		attestation.setBlockNumber(result.blockNumber());
		attestation.setMintStatus(result.mintStatus());
		attestation.setMintedAt(Instant.now());
		attestation.setExplorerUrl(buildExplorerUrl(result));
		attestationRepository.save(attestation);
	}

	private void saveLegacyRecord(PolicyNftMintResult result, String policyNumber, String customerId) {
		PolicyNftRecord record = new PolicyNftRecord();
		record.setPolicyId(result.policyId());
		record.setPolicyReferenceHash(result.policyReferenceHash());
		record.setPolicyNumber(policyNumber);
		record.setCustomerId(customerId);
		record.setWalletAddress(result.walletAddress());
		record.setTokenId(result.tokenId());
		record.setTransactionHash(result.transactionHash());
		record.setContractAddress(result.contractAddress());
		record.setChainId(result.chainId());
		record.setNetwork(result.network());
		record.setTokenUri(result.metadataUri());
		record.setBlockNumber(result.blockNumber());
		record.setMintMode(result.mode());
		record.setMintStatus(result.mintStatus());
		record.setMintedAt(Instant.now());
		repository.save(record);
	}

	private String buildMetadataUri(String policyId) {
		return "ipfs://gcul-policy/" + policyId;
	}

	private static String buildExplorerUrl(PolicyNftMintResult result) {
		return null;
	}

	private static String requireText(String value, String field) {
		if (!StringUtils.hasText(value)) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, field + " is required");
		}
		return value.trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (StringUtils.hasText(value)) {
				return value.trim();
			}
		}
		return "";
	}

}
