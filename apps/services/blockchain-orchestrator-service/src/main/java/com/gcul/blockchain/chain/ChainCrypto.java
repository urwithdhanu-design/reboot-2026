package com.gcul.blockchain.chain;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

public final class ChainCrypto {

	private ChainCrypto() {
	}

	public static String sha256Hex(String input) {
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception ex) {
			throw new IllegalStateException("SHA-256 unavailable", ex);
		}
	}

	public static String merkleRoot(List<String> leafHashes) {
		if (leafHashes.isEmpty()) {
			return sha256Hex("empty");
		}
		List<String> level = leafHashes;
		while (level.size() > 1) {
			java.util.ArrayList<String> next = new java.util.ArrayList<>();
			for (int i = 0; i < level.size(); i += 2) {
				String left = level.get(i);
				String right = i + 1 < level.size() ? level.get(i + 1) : left;
				next.add(sha256Hex(left + right));
			}
			level = next;
		}
		return level.get(0);
	}

	public static KeyPair generateEd25519KeyPair() {
		try {
			KeyPairGenerator gen = KeyPairGenerator.getInstance("Ed25519");
			return gen.generateKeyPair();
		}
		catch (Exception ex) {
			throw new IllegalStateException("Ed25519 unavailable", ex);
		}
	}

	public static String signEd25519(String message, java.security.PrivateKey privateKey) {
		try {
			Signature sig = Signature.getInstance("Ed25519");
			sig.initSign(privateKey);
			sig.update(message.getBytes(StandardCharsets.UTF_8));
			return Base64.getEncoder().encodeToString(sig.sign());
		}
		catch (Exception ex) {
			throw new IllegalStateException("sign failed", ex);
		}
	}

	public static boolean verifyEd25519(String message, String signatureBase64, java.security.PublicKey publicKey) {
		try {
			Signature sig = Signature.getInstance("Ed25519");
			sig.initVerify(publicKey);
			sig.update(message.getBytes(StandardCharsets.UTF_8));
			return sig.verify(Base64.getDecoder().decode(signatureBase64));
		}
		catch (Exception ex) {
			return false;
		}
	}

	public static String publicKeyBase64(java.security.PublicKey key) {
		return Base64.getEncoder().encodeToString(key.getEncoded());
	}
}
