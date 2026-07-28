package com.gcul.blockchain.ledger;

import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.gcul.blockchain.canton.CantonPolicyMintService;

@Component
public class CantonLedgerAdapter implements LedgerAdapter {

	private final CantonPolicyMintService cantonPolicyMintService;

	public CantonLedgerAdapter(CantonPolicyMintService cantonPolicyMintService) {
		this.cantonPolicyMintService = cantonPolicyMintService;
	}

	@Override
	public String ledgerId() {
		return "canton";
	}

	@Override
	public boolean isActive() {
		return cantonPolicyMintService.isActive();
	}

	@Override
	public Map<String, Object> status() {
		return cantonPolicyMintService.status();
	}

	@Override
	public PolicyNftMintResult mint(MintRequest request) {
		return cantonPolicyMintService.mintPolicy(request);
	}

	@Override
	public Optional<Map<String, Object>> verify(String policyId, String policyReferenceHash) {
		return Optional.of(cantonPolicyMintService.verifyPolicy(policyId, policyReferenceHash));
	}
}
