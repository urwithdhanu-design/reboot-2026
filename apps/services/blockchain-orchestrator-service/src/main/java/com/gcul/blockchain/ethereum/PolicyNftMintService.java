package com.gcul.blockchain.ethereum;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.blockchain.config.EthereumProperties;
import com.gcul.blockchain.ethereum.PolicyMintValidator.MintContext;
import com.gcul.blockchain.ledger.LedgerAdapter;
import com.gcul.blockchain.ledger.LedgerAdapterRegistry;
import com.gcul.blockchain.model.PolicyLedgerAttestation;
import com.gcul.blockchain.model.PolicyNftRecord;
import com.gcul.blockchain.repository.PolicyLedgerAttestationRepository;
import com.gcul.blockchain.repository.PolicyNftRecordRepository;

@Service
public class PolicyNftMintService {

	private final EthereumProperties props;
	private final PolicyNftRecordRepository repository;
	private final PolicyLedgerAttestationRepository attestationRepository;
	private final PolicyMintValidator validator;
	private final LedgerAdapterRegistry ledgerRegistry;

	public PolicyNftMintService(
			EthereumProperties props,
			PolicyNftRecordRepository repository,
			PolicyLedgerAttestationRepository attestationRepository,
			PolicyMintValidator validator,
			LedgerAdapterRegistry ledgerRegistry) {
		this.props = props;
		this.repository = repository;
		this.attestationRepository = attestationRepository;
		this.validator = validator;
		this.ledgerRegistry = ledgerRegistry;
	}

	public Map<String, Object> status() {
		return ledgerRegistry.allStatus();
	}

	@Transactional
	public PolicyNftMintResult mintPolicyNft(MintRequest request) {
		String policyId = requireText(request.policyId(), "policyId");
		String policyReferenceHash = requireText(request.policyReferenceHash(), "policyReferenceHash");
		String walletAddress = EthereumAddressValidator.normalize(request.walletAddress());
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

		saveAttestation(result, adapter.ledgerId(), policyNumber, customerId);
		saveLegacyRecord(result, policyNumber, customerId);
		return result;
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
		if (StringUtils.hasText(props.getTokenUriBase())) {
			String base = props.getTokenUriBase().trim();
			return base.endsWith("/") ? base + policyId : base + "/" + policyId;
		}
		return "ipfs://gcul-policy/" + policyId;
	}

	private static String buildExplorerUrl(PolicyNftMintResult result) {
		if (result.transactionHash() == null || result.transactionHash().startsWith("0xsim")) {
			return null;
		}
		if ("ethereum".equalsIgnoreCase(result.mode())) {
			return "https://sepolia.etherscan.io/tx/" + result.transactionHash();
		}
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

	public record MintRequest(
			String policyId,
			String policyNumber,
			String customerId,
			String walletAddress,
			String policyReferenceHash,
			String metadataUri,
			boolean kycVerified,
			boolean policyEligible,
			Map<String, Object> metadata) {
	}
}
