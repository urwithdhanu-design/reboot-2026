package com.gcul.blockchain.ledger;

public final class WalletAddressValidator {
	private WalletAddressValidator() { }
	public static boolean isValid(String address) { return address != null && address.matches("^0x[0-9a-fA-F]{40}$"); }
	public static String normalize(String address) {
		if (!isValid(address)) throw new IllegalArgumentException("Invalid wallet address: " + address);
		return address.trim().toLowerCase();
	}
}
