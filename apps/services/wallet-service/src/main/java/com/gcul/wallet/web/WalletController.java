package com.gcul.wallet.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.wallet.service.WalletService;
import com.gcul.wallet.web.LinkWalletRequest;
import com.gcul.wallet.web.PayRequest;
import com.gcul.wallet.web.RechargeRequest;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

	private final WalletService walletService;

	public WalletController(WalletService walletService) {
		this.walletService = walletService;
	}

	@GetMapping
	public Map<String, Object> getWallet(HttpServletRequest request) {
		return walletService.getWallet(requireUserId(request));
	}

	@PostMapping("/link")
	public Map<String, Object> linkWallet(HttpServletRequest request, @RequestBody LinkWalletRequest body) {
		String token = requireBearer(request);
		return walletService.linkWallet(
				requireUserId(request),
				(String) request.getAttribute("userEmail"),
				body.address(),
				token);
	}

	@PostMapping("/create")
	public Map<String, Object> createWallet(HttpServletRequest request) {
		String token = requireBearer(request);
		return walletService.createWallet(
				requireUserId(request),
				(String) request.getAttribute("userEmail"),
				token);
	}

	@PostMapping("/resend-consent")
	public Map<String, Object> resendConsentEmail(HttpServletRequest request) {
		String token = requireBearer(request);
		return walletService.resendConsentEmail(
				requireUserId(request),
				(String) request.getAttribute("userEmail"),
				token);
	}

	@PostMapping("/recharge")
	public Map<String, Object> rechargeWallet(
			HttpServletRequest request,
			@RequestBody RechargeRequest body) {
		return walletService.rechargeWallet(requireUserId(request), body.amount());
	}

	@PostMapping("/pay")
	public Map<String, Object> payForPremium(
			HttpServletRequest request,
			@RequestBody PayRequest body) {
		return walletService.payForPremium(requireUserId(request), body.quote_id(), body.amount());
	}

	@GetMapping("/transactions")
	public Map<String, Object> listTransactions(HttpServletRequest request) {
		var items = walletService.listTransactions(requireUserId(request));
		return Map.of("transactions", items, "count", items.size());
	}

	private static String requireUserId(HttpServletRequest request) {
		Object userId = request.getAttribute("userId");
		if (userId instanceof String id && !id.isBlank()) {
			return id;
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
	}

	private static String requireBearer(HttpServletRequest request) {
		String header = request.getHeader("Authorization");
		if (header != null && header.startsWith("Bearer ")) {
			return header.substring(7);
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
	}
}
