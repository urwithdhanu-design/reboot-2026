package com.gcul.wallet.messaging;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;
import com.gcul.wallet.model.CustomerWallet;
import com.gcul.wallet.model.WalletTransaction;

@Component
public class WalletEventPublisher {

	private final GculEventPublisher publisher;

	public WalletEventPublisher(GculEventPublisher publisher) {
		this.publisher = publisher;
	}

	public void walletLinked(String userId, CustomerWallet wallet) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("eventType", "WalletLinked");
		payload.put("customerId", userId);
		payload.put("walletAddress", wallet.getAddress());
		payload.put("network", "Ethereum Sepolia");
		payload.put("status", "SUCCESS");
		publisher.publish(EventTopics.WALLET, payload);
	}

	public void walletRecharged(String userId, CustomerWallet wallet, WalletTransaction tx) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("eventType", "WalletRecharged");
		payload.put("customerId", userId);
		payload.put("walletAddress", wallet.getAddress());
		payload.put("amount", tx.getAmount());
		payload.put("currency", tx.getCurrency());
		payload.put("balanceGbp", wallet.getBalanceGbp());
		payload.put("transactionId", tx.getId());
		payload.put("status", "SUCCESS");
		publisher.publish(EventTopics.WALLET, payload);
	}
}
