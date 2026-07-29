package com.gcul.wallet.web;

public record PayRequest(
		String quote_id,
		double amount,
		String vendor_code,
		String vendor_name) {
}
