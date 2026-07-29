package com.gcul.policy.client;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Component
public class VendorReserveClient {

	private final RestClient restClient;

	public VendorReserveClient(@Value("${gcul.wallet-service.url}") String walletBaseUrl) {
		this.restClient = RestClient.builder().baseUrl(walletBaseUrl).build();
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> view(String vendorCode, String vendorName) {
		try {
			Map<String, Object> body = restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/internal/vendor-reserve/{code}")
							.queryParam("vendorName", vendorName == null ? "" : vendorName)
							.build(vendorCode))
					.retrieve()
					.body(Map.class);
			if (body == null) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty vendor reserve response");
			}
			return body;
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (org.springframework.web.client.HttpStatusCodeException ex) {
			throw new ResponseStatusException(HttpStatus.valueOf(ex.getStatusCode().value()),
					extractDetail(ex.getResponseBodyAsString()));
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach wallet service for vendor reserve");
		}
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> contribute(String vendorCode, String vendorName, double amount, String reference) {
		try {
			Map<String, Object> payload = new java.util.LinkedHashMap<>();
			payload.put("amount", amount);
			if (reference != null && !reference.isBlank()) {
				payload.put("reference", reference);
			}
			Map<String, Object> body = restClient.post()
					.uri(uriBuilder -> uriBuilder
							.path("/api/internal/vendor-reserve/{code}/contribute")
							.queryParam("vendorName", vendorName == null ? "" : vendorName)
							.build(vendorCode))
					.body(payload)
					.retrieve()
					.body(Map.class);
			if (body == null) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty vendor contribution response");
			}
			return body;
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (org.springframework.web.client.HttpStatusCodeException ex) {
			throw new ResponseStatusException(HttpStatus.valueOf(ex.getStatusCode().value()),
					extractDetail(ex.getResponseBodyAsString()));
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach wallet service for vendor contribution");
		}
	}

	private static String extractDetail(String body) {
		if (body == null || body.isBlank()) {
			return "Wallet service request failed";
		}
		int start = body.indexOf("\"detail\"");
		if (start < 0) {
			return body.length() > 120 ? body.substring(0, 120) : body;
		}
		int colon = body.indexOf(':', start);
		int quoteStart = body.indexOf('"', colon + 1);
		int quoteEnd = body.indexOf('"', quoteStart + 1);
		if (quoteStart < 0 || quoteEnd < 0) {
			return "Wallet service request failed";
		}
		return body.substring(quoteStart + 1, quoteEnd);
	}
}
