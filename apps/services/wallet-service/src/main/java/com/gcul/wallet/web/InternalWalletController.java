package com.gcul.wallet.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.wallet.service.WalletService;

@RestController
@RequestMapping("/api/internal/wallet")
public class InternalWalletController {

	private final WalletService walletService;

	public InternalWalletController(WalletService walletService) {
		this.walletService = walletService;
	}

	@GetMapping
	public Map<String, Object> lookup(
			@RequestParam(required = false) String customerId,
			@RequestParam(required = false) String email) {
		if ((customerId == null || customerId.isBlank()) && (email == null || email.isBlank())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "customerId or email is required");
		}
		if (customerId != null && !customerId.isBlank()) {
			return walletService.getWalletWithUser(customerId.trim());
		}
		return walletService.getWalletByEmail(email.trim());
	}
}
