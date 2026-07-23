package com.gcul.blockchain.messaging;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;

@Service
public class PolicyMintService {

	private static final Logger log = LoggerFactory.getLogger(PolicyMintService.class);

	private final GculEventPublisher publisher;
	private final Set<String> mintedPolicies = ConcurrentHashMap.newKeySet();

	public PolicyMintService(GculEventPublisher publisher) {
		this.publisher = publisher;
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
		String tokenId = "NFT-" + policyId.replace("POL-", "");
		String txHash = "0x" + UUID.randomUUID().toString().replace("-", "");

		Map<String, Object> minted = new LinkedHashMap<>();
		minted.put("eventType", "PolicyMinted");
		minted.put("policyId", policyId);
		minted.put("policyNumber", payload.get("policyNumber"));
		minted.put("customerId", payload.get("customerId"));
		minted.put("tokenId", tokenId);
		minted.put("transactionHash", txHash);
		minted.put("network", "Ethereum Sepolia");
		minted.put("status", "MINTED");
		publisher.publish(EventTopics.BLOCKCHAIN, minted);
		log.info("Mint completed policyId={} tokenId={}", policyId, tokenId);
		return true;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
