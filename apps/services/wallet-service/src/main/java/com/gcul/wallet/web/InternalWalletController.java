package com.gcul.wallet.web;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.wallet.service.WalletService;

@RestController
@RequestMapping("/api/internal/wallet")
public class InternalWalletController {

	private final WalletService walletService;

	public InternalWalletController(WalletService walletService) {
		this.walletService = walletService;
	}

	@org.springframework.web.bind.annotation.GetMapping
	public Map<String, Object> lookup(
			@org.springframework.web.bind.annotation.RequestParam(required = false) String customerId,
			@org.springframework.web.bind.annotation.RequestParam(required = false) String email,
			@org.springframework.web.bind.annotation.RequestParam(required = false) String address) {
		if ((customerId == null || customerId.isBlank())
				&& (email == null || email.isBlank())
				&& (address == null || address.isBlank())) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST, "customerId, email, or address is required");
		}
		if (address != null && !address.isBlank()) {
			return walletService.getWalletByAddress(address.trim());
		}
		if (customerId != null && !customerId.isBlank()) {
			return walletService.getWalletWithUser(customerId.trim());
		}
		return walletService.getWalletByEmail(email.trim());
	}

	@PostMapping("/credit-claim")
	public Map<String, Object> creditClaim(@RequestBody CreditClaimRequest body) {
		return walletService.creditClaimPayout(
				body.customerId(),
				body.email(),
				body.walletAddress(),
				body.claimId(),
				body.amount());
	}

	public record CreditClaimRequest(
			String customerId,
			String email,
			String walletAddress,
			String claimId,
			double amount) {
	}
}
