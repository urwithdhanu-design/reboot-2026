package com.gcul.blockchain.ledger;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;


@Component
public class SimulatedLedgerAdapter implements LedgerAdapter {

	private static final Logger log = LoggerFactory.getLogger(SimulatedLedgerAdapter.class);
	private static final String NETWORK = "Canton local simulation";

	@Override
	public String ledgerId() {
		return "simulated";
	}

	@Override
	public boolean isActive() {
		return true;
	}

	@Override
	public Map<String, Object> status() {
		Map<String, Object> status = new LinkedHashMap<>();
		status.put("enabled", true);
		status.put("live", isActive());
		status.put("mode", "simulated");
		status.put("network", NETWORK);
		status.put("chainId", 0L);
		return status;
	}

	@Override
	public PolicyNftMintResult mint(MintRequest request) {
		String policyId = request.policyId();
		String policyReferenceHash = request.policyReferenceHash();
		String walletAddress = request.walletAddress();
		String metadataUri = firstNonBlank(request.metadataUri(), "ipfs://gcul-policy/" + policyId);
		String tokenId = "SIM-" + policyId.replace("POL-", "");
		String txHash = "0xsim" + UUID.randomUUID().toString().replace("-", "");
		log.info("Simulated policy NFT mint policyId={} tokenId={} wallet={}", policyId, tokenId, walletAddress);
		return new PolicyNftMintResult(
				policyId,
				policyReferenceHash,
				tokenId,
				txHash,
				walletAddress,
				"simulated",
				0L,
				0L,
				NETWORK,
				metadataUri,
				"simulated",
				"MINTED");
	}

	@Override
	public Optional<Map<String, Object>> verify(String policyId, String policyReferenceHash) {
		return Optional.empty();
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
