package com.gcul.blockchain.ledger;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.util.StringUtils;

import com.gcul.blockchain.config.CantonProperties;

/**
 * Standard mint/verify attestation payload — honest ledger mode for hybrid architecture.
 */
public final class LedgerAttestation {

	private LedgerAttestation() {
	}

	public static Map<String, Object> fromMint(PolicyNftMintResult result, CantonProperties cantonProperties) {
		LedgerMode mode = LedgerMode.normalize(result.ledgerMode());
		Map<String, Object> map = basePolicyFields(result);
		map.put("ledgerId", result.mode());
		map.put("ledgerMode", mode.id());
		map.put("ledger_mode", mode.id());
		map.put("mode", result.mode());
		map.put("mintStatus", result.mintStatus());
		map.put("verified", mode == LedgerMode.CANTON);
		map.put("packageId", firstNonBlank(result.packageId(), cantonProperties.getPackageId()));
		map.put("package_id", firstNonBlank(result.packageId(), cantonProperties.getPackageId()));
		map.put("updateId", result.transactionHash());
		map.put("update_id", result.transactionHash());
		map.put("contractId", result.tokenId());
		map.put("contract_id", result.tokenId());
		map.put("offset", result.blockNumber());
		return map;
	}

	public static Map<String, Object> enrichVerify(
			Map<String, Object> verifyResult,
			CantonProperties cantonProperties,
			String mintLedgerId) {
		Map<String, Object> map = new LinkedHashMap<>(verifyResult);
		String ledgerId = firstNonBlank(
				str(map.get("ledgerId")),
				str(map.get("ledger")),
				mintLedgerId,
				"canton");
		LedgerMode mode = LedgerMode.fromLedgerId(ledgerId);
		if (map.containsKey("mode")) {
			mode = LedgerMode.normalize(str(map.get("mode")));
		}
		boolean verified = Boolean.TRUE.equals(map.get("verified"));
		map.put("ledgerId", ledgerId);
		map.put("ledgerMode", mode.id());
		map.put("ledger_mode", mode.id());
		map.put("verified", verified);
		map.put("packageId", firstNonBlank(str(map.get("packageId")), cantonProperties.getPackageId()));
		map.put("package_id", firstNonBlank(str(map.get("package_id")), cantonProperties.getPackageId()));
		if (map.get("updateId") != null) {
			map.put("update_id", map.get("updateId"));
		}
		if (map.get("contractId") != null) {
			map.put("contract_id", map.get("contractId"));
		}
		return map;
	}

	private static Map<String, Object> basePolicyFields(PolicyNftMintResult result) {
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
		return map;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
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
