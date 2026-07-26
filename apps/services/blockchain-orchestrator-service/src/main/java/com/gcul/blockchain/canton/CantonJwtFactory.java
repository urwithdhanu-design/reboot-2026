package com.gcul.blockchain.canton;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

final class CantonJwtFactory {

	private static final String LEDGER_API = "https://daml.com/ledger-api";
	private static final String APPLICATION_ID = "gcul-orchestrator";

	private CantonJwtFactory() {
	}

	static String adminToken(ObjectMapper mapper, String ledgerId) {
		Map<String, Object> ledgerApi = new LinkedHashMap<>();
		ledgerApi.put("ledgerId", ledgerId);
		ledgerApi.put("applicationId", APPLICATION_ID);
		ledgerApi.put("admin", true);
		ledgerApi.put("actAs", List.of());
		ledgerApi.put("readAs", List.of());
		return encode(mapper, ledgerApi);
	}

	static String submitToken(ObjectMapper mapper, String ledgerId, Collection<String> parties) {
		Map<String, Object> ledgerApi = new LinkedHashMap<>();
		ledgerApi.put("ledgerId", ledgerId);
		ledgerApi.put("applicationId", APPLICATION_ID);
		ledgerApi.put("actAs", parties);
		ledgerApi.put("readAs", parties);
		return encode(mapper, ledgerApi);
	}

	static String actAsToken(ObjectMapper mapper, String ledgerId, Collection<String> parties) {
		return submitToken(mapper, ledgerId, parties);
	}

	private static String encode(ObjectMapper mapper, Map<String, Object> ledgerApiClaims) {
		try {
			Map<String, Object> payload = new LinkedHashMap<>();
			payload.put(LEDGER_API, ledgerApiClaims);
			payload.put("exp", Instant.now().getEpochSecond() + 86_400);
			String header = base64Url(mapper.writeValueAsString(Map.of("alg", "HS256", "typ", "JWT")));
			String body = base64Url(mapper.writeValueAsString(payload));
			return header + "." + body + ".";
		}
		catch (Exception ex) {
			throw new IllegalStateException("Failed to build Canton JWT", ex);
		}
	}

	private static String base64Url(String value) {
		return Base64.getUrlEncoder().withoutPadding()
				.encodeToString(value.getBytes(StandardCharsets.UTF_8));
	}
}
