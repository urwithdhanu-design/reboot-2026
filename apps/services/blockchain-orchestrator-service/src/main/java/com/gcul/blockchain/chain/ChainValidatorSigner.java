package com.gcul.blockchain.chain;

import java.nio.charset.StandardCharsets;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ChainValidatorSigner {

	private final byte[] secret;
	private final String validatorId;

	public ChainValidatorSigner(
			@Value("${gcul.chain.validator-secret:gcul-insurance-chain-dev-secret-change-me}") String secret,
			@Value("${gcul.chain.validator-id:gcul-validator-primary}") String validatorId) {
		this.secret = secret.getBytes(StandardCharsets.UTF_8);
		this.validatorId = validatorId;
	}

	public String validatorId() {
		return validatorId;
	}

	public String sign(String message) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secret, "HmacSHA256"));
			byte[] raw = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
			return java.util.HexFormat.of().formatHex(raw);
		}
		catch (Exception ex) {
			throw new IllegalStateException("HMAC sign failed", ex);
		}
	}

	public boolean verify(String message, String signatureHex) {
		return sign(message).equalsIgnoreCase(signatureHex);
	}
}
