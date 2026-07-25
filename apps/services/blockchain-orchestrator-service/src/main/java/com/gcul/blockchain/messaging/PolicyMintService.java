package com.gcul.blockchain.messaging;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.gcul.blockchain.chain.ChainLedger;
import com.gcul.blockchain.chain.ChainTransactionType;
import com.gcul.blockchain.chain.InsuranceChainService;
import com.gcul.blockchain.chain.InsuranceChainService.RecordTxRequest;
import com.gcul.blockchain.ethereum.EthereumAddressValidator;
import com.gcul.blockchain.ethereum.PolicyNftMintResult;
import com.gcul.blockchain.ethereum.PolicyNftMintService;
import com.gcul.blockchain.ethereum.PolicyNftMintService.MintRequest;
import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;

@Service
public class PolicyMintService {

	private static final Logger log = LoggerFactory.getLogger(PolicyMintService.class);

	private final GculEventPublisher publisher;
	private final Set<String> mintedPolicies = ConcurrentHashMap.newKeySet();
	private final InsuranceChainService insuranceChain;
	private final PolicyNftMintService policyNftMintService;

	public PolicyMintService(
			GculEventPublisher publisher,
			InsuranceChainService insuranceChain,
			PolicyNftMintService policyNftMintService) {
		this.publisher = publisher;
		this.insuranceChain = insuranceChain;
		this.policyNftMintService = policyNftMintService;
	}

	public boolean handle(String eventType, Map<String, Object> payload) {
		if ("PolicyCreated".equals(eventType)) {
			log.info("Policy created {} — awaiting mint request", payload.get("policyId"));
			return true;
		}
		if (!"PolicyMintRequested".equals(eventType)) {
			return false;
		}
		String policyId = str(payload.get("policyId"));
		if (policyId.isBlank() || !mintedPolicies.add(policyId)) {
			return true;
		}

		String walletAddress = str(payload.get("walletAddress"));
		if (!EthereumAddressValidator.isValid(walletAddress)) {
			log.error("Policy mint skipped — invalid or missing wallet address for policy {}", policyId);
			mintedPolicies.remove(policyId);
			return true;
		}

		try {
			PolicyNftMintResult result = policyNftMintService.mintPolicyNft(new MintRequest(
					policyId,
					str(payload.get("policyNumber")),
					str(payload.get("customerId")),
					walletAddress,
					Map.of("source", "pubsub")));

			publishMintedEvent(payload, result);
			recordOnInsuranceChain(payload, result);
			log.info("Mint completed policyId={} tokenId={} mode={}", policyId, result.tokenId(), result.mode());
		}
		catch (Exception ex) {
			mintedPolicies.remove(policyId);
			log.error("Policy mint failed for {}: {}", policyId, ex.getMessage(), ex);
		}
		return true;
	}

	public PolicyNftMintResult mintFromApi(Map<String, Object> payload) {
		String policyId = str(payload.get("policyId"));
		if (policyId.isBlank()) {
			throw new IllegalArgumentException("policyId is required");
		}
		if (!mintedPolicies.add(policyId)) {
			return policyNftMintService.findByPolicyId(policyId)
					.map(record -> new PolicyNftMintResult(
							record.getPolicyId(),
							record.getTokenId(),
							record.getTransactionHash(),
							record.getWalletAddress(),
							record.getContractAddress(),
							record.getChainId(),
							record.getNetwork(),
							record.getTokenUri(),
							record.getMintMode(),
							record.getStatus()))
					.orElseThrow(() -> new IllegalStateException("Policy already minted: " + policyId));
		}

		try {
			PolicyNftMintResult result = policyNftMintService.mintPolicyNft(new MintRequest(
					policyId,
					str(payload.get("policyNumber")),
					str(payload.get("customerId")),
					str(payload.get("walletAddress")),
					payload));

			publishMintedEvent(payload, result);
			recordOnInsuranceChain(payload, result);
			return result;
		}
		catch (Exception ex) {
			mintedPolicies.remove(policyId);
			throw ex;
		}
	}

	private void publishMintedEvent(Map<String, Object> payload, PolicyNftMintResult result) {
		Map<String, Object> minted = new LinkedHashMap<>();
		minted.put("eventType", "PolicyMinted");
		minted.put("policyId", result.policyId());
		minted.put("policyNumber", firstNonBlank(str(payload.get("policyNumber")), result.policyId()));
		minted.put("customerId", str(payload.get("customerId")));
		minted.put("tokenId", result.tokenId());
		minted.put("transactionHash", result.transactionHash());
		minted.put("walletAddress", result.walletAddress());
		minted.put("contractAddress", result.contractAddress());
		minted.put("chainId", result.chainId());
		minted.put("network", result.network());
		minted.put("mode", result.mode());
		minted.put("status", result.status());
		publisher.publish(EventTopics.BLOCKCHAIN, minted);
	}

	private void recordOnInsuranceChain(Map<String, Object> payload, PolicyNftMintResult result) {
		String policyId = result.policyId();
		insuranceChain.recordTransaction(new RecordTxRequest(
				ChainTransactionType.WORKFLOW_STEP,
				ChainLedger.POLICY,
				Map.of(
						"policyId", policyId,
						"policyNumber", firstNonBlank(str(payload.get("policyNumber")), policyId),
						"tokenId", result.tokenId(),
						"transactionHash", result.transactionHash(),
						"walletAddress", result.walletAddress(),
						"workflow", "policy_mint",
						"mode", result.mode()),
				str(payload.get("customerId")),
				"policy_service",
				result.transactionHash(),
				null));
		insuranceChain.recordTransaction(new RecordTxRequest(
				ChainTransactionType.POLICY_ISSUED,
				ChainLedger.POLICY,
				Map.of(
						"policyId", policyId,
						"tokenId", result.tokenId(),
						"transactionHash", result.transactionHash(),
						"walletAddress", result.walletAddress(),
						"contractAddress", result.contractAddress(),
						"network", result.network()),
				str(payload.get("customerId")),
				"blockchain_orchestrator",
				result.transactionHash(),
				null));
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
