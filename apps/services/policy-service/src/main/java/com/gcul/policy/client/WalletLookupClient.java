package com.gcul.policy.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
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
	public WalletLookup lookupByCustomerId(String customerId) {
		if (!StringUtils.hasText(customerId)) {
			return WalletLookup.empty();
		}
		return lookup("/api/internal/wallet", "customerId", customerId.trim());
	}

	@SuppressWarnings("unchecked")
	public WalletLookup lookupByEmail(String email) {
		if (!StringUtils.hasText(email)) {
			return WalletLookup.empty();
		}
		return lookup("/api/internal/wallet", "email", email.trim().toLowerCase());
	}

	@SuppressWarnings("unchecked")
	private WalletLookup lookup(String path, String param, String value) {
		try {
			Map<String, Object> wallet = restClient.get()
					.uri(uriBuilder -> uriBuilder.path(path).queryParam(param, value).build())
					.retrieve()
					.body(Map.class);
			if (wallet == null || !"connected".equals(wallet.get("status"))) {
				return WalletLookup.empty();
			}
			String address = wallet.get("address") == null ? "" : String.valueOf(wallet.get("address")).trim();
			String userId = wallet.get("userId") == null ? "" : String.valueOf(wallet.get("userId")).trim();
			return new WalletLookup(userId, address, true);
		}
		catch (Exception ex) {
			log.debug("Wallet lookup failed for {}={}: {}", param, value, ex.getMessage());
			return WalletLookup.empty();
		}
	}

	public record WalletLookup(String userId, String address, boolean connected) {
		public static WalletLookup empty() {
			return new WalletLookup("", "", false);
		}
	}
}
