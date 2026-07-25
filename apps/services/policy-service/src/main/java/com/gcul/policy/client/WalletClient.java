package com.gcul.policy.client;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Component
public class WalletClient {

	private final RestClient restClient;

	public WalletClient(@Value("${gcul.wallet-service.url}") String walletBaseUrl) {
		this.restClient = RestClient.builder().baseUrl(walletBaseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> payPremium(String bearerToken, String quoteId, double amount) {
		try {
			Map<String, Object> body = restClient.post()
					.uri("/api/wallet/pay")
					.header("Authorization", "Bearer " + bearerToken)
					.body(Map.of("quote_id", quoteId, "amount", amount))
					.retrieve()
					.body(Map.class);
			if (body == null) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty wallet payment response");
			}
			return body;
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (org.springframework.web.client.HttpStatusCodeException ex) {
			String detail = ex.getResponseBodyAsString();
			if (detail != null && detail.contains("detail")) {
				throw new ResponseStatusException(HttpStatus.valueOf(ex.getStatusCode().value()),
						extractDetail(detail));
			}
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Wallet payment failed");
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach wallet service");
		}
	}

	private static String extractDetail(String body) {
		int start = body.indexOf("\"detail\"");
		if (start < 0) {
			return "Wallet payment failed";
		}
		int colon = body.indexOf(':', start);
		int quoteStart = body.indexOf('"', colon + 1);
		int quoteEnd = body.indexOf('"', quoteStart + 1);
		if (quoteStart < 0 || quoteEnd < 0) {
			return "Wallet payment failed";
		}
		return body.substring(quoteStart + 1, quoteEnd);
	}
}
