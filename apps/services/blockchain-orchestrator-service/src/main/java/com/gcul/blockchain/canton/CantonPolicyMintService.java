package com.gcul.blockchain.canton;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.gcul.blockchain.config.CantonProperties;
import com.gcul.blockchain.ledger.MintRequest;
import com.gcul.blockchain.ledger.PolicyNftMintResult;

@Service
public class CantonPolicyMintService {

	private final CantonProperties props;
	private final CantonJsonApiClient client;
	private final String ledgerBackend;

	public CantonPolicyMintService(
			CantonProperties props,
			CantonJsonApiClient client,
			@Value("${gcul.ledger.backend:canton}") String ledgerBackend) {
		this.props = props;
		this.client = client;
		this.ledgerBackend = ledgerBackend;
	}

	public boolean isActive() {
		return "canton".equalsIgnoreCase(ledgerBackend)
				&& props.isEnabled()
				&& client.isReachable();
	}

	public Map<String, Object> status() {
		Map<String, Object> status = new LinkedHashMap<>();
		boolean reachable = client.isReachable();
		status.put("enabled", props.isEnabled());
		status.put("live", isActive());
		status.put("reachable", reachable);
		status.put("network", props.getNetwork());
		status.put("jsonApiUrl", props.getJsonApiUrl());
		status.put("insurerPartyHint", props.getInsurerPartyHint());
		status.put("mode", isActive() ? "canton" : (reachable ? "canton-unconfigured" : "canton-offline"));
		status.put("templateId", props.templateId("Gcul.InsurancePolicy", "InsurancePolicy"));
		status.put("chainId", 0L);
		status.put("contractAddress", props.templateId("Gcul.InsurancePolicy", "InsurancePolicy"));
		return status;
	}

	public Map<String, Object> verifyPolicy(String policyId, String policyReferenceHash) {
		if (!isActive()) {
			Map<String, Object> offline = new LinkedHashMap<>();
			offline.put("policyId", policyId);
			offline.put("policyReferenceHash", policyReferenceHash);
			offline.put("verified", false);
			offline.put("ledger", "canton");
			offline.put("ledgerId", "canton");
			offline.put("ledgerMode", com.gcul.blockchain.ledger.LedgerMode.CANTON.id());
			offline.put("mode", "canton-offline");
			offline.put("reason", "Canton ledger not reachable");
			return offline;
		}
		return client.verifyPolicy(policyId, policyReferenceHash);
	}

	public java.util.Optional<String> verifyPolicyContract(String policyReferenceHash) {
		if (!isActive()) {
			return java.util.Optional.empty();
		}
		return client.verifyPolicyContract(policyReferenceHash);
	}

	public PolicyNftMintResult mintPolicy(MintRequest request) {
		CantonJsonApiClient.CantonMintResult result = client.mintPolicy(new CantonJsonApiClient.CantonMintCommand(
				request.policyId(),
				firstNonBlank(request.policyNumber(), request.policyId()),
				request.policyReferenceHash(),
				firstNonBlank(request.customerId(), "unknown"),
				request.walletAddress(),
				firstNonBlank(request.metadataUri(), "ipfs://gcul-policy/" + request.policyId())));

		String tokenId = shortenContractId(result.contractId());
		return new PolicyNftMintResult(
				request.policyId(),
				request.policyReferenceHash(),
				tokenId,
				result.updateId(),
				request.walletAddress(),
				result.templateId(),
				0L,
				result.offset(),
				result.network(),
				firstNonBlank(request.metadataUri(), "ipfs://gcul-policy/" + request.policyId()),
				"canton",
				"MINTED",
				com.gcul.blockchain.ledger.LedgerMode.CANTON.id(),
				props.getPackageId());
	}

	private static String shortenContractId(String contractId) {
		if (!StringUtils.hasText(contractId)) {
			return "CANTON-UNKNOWN";
		}
		String trimmed = contractId.trim();
		int colon = trimmed.lastIndexOf(':');
		if (colon >= 0 && colon < trimmed.length() - 1) {
			return "CANTON-" + trimmed.substring(colon + 1);
		}
		if (trimmed.length() > 24) {
			return "CANTON-" + trimmed.substring(trimmed.length() - 12);
		}
		return "CANTON-" + trimmed;
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
