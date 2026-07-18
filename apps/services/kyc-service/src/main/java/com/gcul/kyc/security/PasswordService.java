package com.gcul.kyc.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PasswordService {

	private final SecureRandom random = new SecureRandom();

	public String hash(String password) {
		String salt = HexFormat.of().formatHex(randomBytes(16));
		return salt + "$" + digest(salt, password);
	}

	public boolean matches(String password, String stored) {
		String[] parts = stored.split("\\$", 2);
		if (parts.length != 2) {
			return false;
		}
		return MessageDigest.isEqual(
				parts[1].getBytes(StandardCharsets.UTF_8),
				digest(parts[0], password).getBytes(StandardCharsets.UTF_8));
	}

	private String digest(String salt, String password) {
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			for (int i = 0; i < 120_000; i++) {
				md.update(salt.getBytes(StandardCharsets.UTF_8));
				md.update(password.getBytes(StandardCharsets.UTF_8));
			}
			return HexFormat.of().formatHex(md.digest());
		}
		catch (NoSuchAlgorithmException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Hash unavailable");
		}
	}

	private byte[] randomBytes(int len) {
		byte[] bytes = new byte[len];
		random.nextBytes(bytes);
		return bytes;
	}
}
