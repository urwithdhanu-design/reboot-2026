package com.gcul.blockchain.ethereum;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.blockchain.repository.PolicyLedgerAttestationRepository;
import com.gcul.blockchain.repository.PolicyNftRecordRepository;

@Component
public class PolicyMintValidator {

	private final PolicyNftRecordRepository repository;
	private final PolicyLedgerAttestationRepository attestationRepository;

	public PolicyMintValidator(
			PolicyNftRecordRepository repository,
			PolicyLedgerAttestationRepository attestationRepository) {
		this.repository = repository;
		this.attestationRepository = attestationRepository;
	}

	public void validate(MintContext context) {
		if (!EthereumAddressValidator.isValid(context.walletAddress())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Ethereum wallet address");
		}
		if (!StringUtils.hasText(context.policyId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policyId is required");
		}
		if (!StringUtils.hasText(context.policyReferenceHash())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policyReferenceHash is required");
		}
		if (!StringUtils.hasText(context.metadataUri())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "metadataURI is required");
		}
		if (repository.findByPolicyId(context.policyId()).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate policy mint request: " + context.policyId());
		}
		if (attestationRepository.findByPolicyIdAndLedgerId(context.policyId(), context.ledgerId()).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Policy already attested on ledger " + context.ledgerId() + ": " + context.policyId());
		}
		if (repository.findByPolicyReferenceHash(context.policyReferenceHash()).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Policy reference already minted");
		}
		if (!context.kycVerified()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,
					"Customer identity verification must be complete before minting");
		}
		if (!context.policyEligible()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Policy is not eligible for minting");
		}
	}

	public record MintContext(
			String policyId,
			String policyReferenceHash,
			String walletAddress,
			String metadataUri,
			String customerId,
			boolean kycVerified,
			boolean policyEligible,
			String ledgerId) {
	}
}
