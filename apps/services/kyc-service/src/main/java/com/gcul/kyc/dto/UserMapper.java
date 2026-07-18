package com.gcul.kyc.dto;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import com.gcul.kyc.model.UserAccount;

public final class UserMapper {

	private UserMapper() {
	}

	public static Map<String, Object> toPublic(UserAccount user) {
		Map<String, Object> map = new HashMap<>();
		map.put("id", user.getId());
		map.put("full_name", user.getFullName());
		map.put("email", user.getEmail());
		map.put("mobile_number", user.getMobileNumber());
		map.put("kyc_status", user.getKycStatus() == null ? "not_started" : user.getKycStatus());
		if (user.hasConnectedWallet()) {
			Map<String, Object> wallet = new HashMap<>();
			wallet.put("address", user.getWalletAddress());
			wallet.put("status", user.getWalletStatus());
			map.put("wallet", wallet);
		}
		else {
			map.put("wallet", null);
		}
		return map;
	}

	public static Map<String, Object> authResponse(String token, UserAccount user) {
		Map<String, Object> map = new HashMap<>();
		map.put("access_token", token);
		map.put("token_type", "bearer");
		map.put("user", toPublic(user));
		return map;
	}

	/** Compact JSON for small string maps (KYC progress). */
	public static String toJson(Map<String, ?> value) {
		StringBuilder sb = new StringBuilder("{");
		boolean first = true;
		for (Map.Entry<String, ?> entry : value.entrySet()) {
			if (!first) {
				sb.append(',');
			}
			first = false;
			sb.append('"').append(escape(entry.getKey())).append('"').append(':');
			Object v = entry.getValue();
			if (v == null) {
				sb.append("null");
			}
			else {
				sb.append('"').append(escape(String.valueOf(v))).append('"');
			}
		}
		return sb.append('}').toString();
	}

	public static Map<String, String> fromJsonMap(String json) {
		Map<String, String> result = new LinkedHashMap<>();
		if (json == null || json.isBlank() || !json.contains(":")) {
			return result;
		}
		String body = json.trim();
		if (body.startsWith("{") && body.endsWith("}")) {
			body = body.substring(1, body.length() - 1);
		}
		for (String part : body.split(",")) {
			String[] kv = part.split(":", 2);
			if (kv.length != 2) {
				continue;
			}
			result.put(unquote(kv[0].trim()), unquote(kv[1].trim()));
		}
		return result;
	}

	private static String escape(String value) {
		return value.replace("\\", "\\\\").replace("\"", "\\\"");
	}

	private static String unquote(String value) {
		if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
			return value.substring(1, value.length() - 1);
		}
		return value;
	}
}
