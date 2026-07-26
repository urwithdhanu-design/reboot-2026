package com.gcul.blockchain.ethereum;

import java.util.regex.Pattern;

public final class EthereumAddressValidator {

	private static final Pattern ADDRESS = Pattern.compile("^0x[0-9a-fA-F]{40}$");

	private EthereumAddressValidator() {
	}

	public static boolean isValid(String address) {
		return address != null && ADDRESS.matcher(address.trim()).matches();
	}

	public static String normalize(String address) {
		if (!isValid(address)) {
			throw new IllegalArgumentException("Invalid Ethereum wallet address: " + address);
		}
		return address.trim().toLowerCase();
	}
}
