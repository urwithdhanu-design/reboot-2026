package com.gcul.policy.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class WalletLookupClient {

	private static final Logger log = LoggerFactory.getLogger(WalletLookupClient.class);

	private final RestClient restClient;

	public WalletLookupClient(@Value("${gcul.wallet-service.url:http://127.0.0.1:8089}") String baseUrl) {
		this.restClient = RestClient.builder()
				.baseUrl(baseUrl)
				.build();
	}

	@SuppressWarnings("unchecked")
	public String lookupWalletAddress(String customerId) {
		if (customerId == null || customerId.isBlank()) {
			return "";
		}
		try {
			Map<String, Object> wallet = restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/internal/wallet")
							.queryParam("customerId", customerId)
							.build())
					.retrieve()
					.body(Map.class);
			if (wallet == null || !"connected".equals(wallet.get("status"))) {
				return "";
			}
			Object address = wallet.get("address");
			return address == null ? "" : String.valueOf(address).trim();
		}
		catch (Exception ex) {
			log.debug("Wallet lookup failed for {}: {}", customerId, ex.getMessage());
			return "";
		}
	}
}
