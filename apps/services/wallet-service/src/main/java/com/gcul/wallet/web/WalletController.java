package com.gcul.wallet.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.wallet.service.WalletService;

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

	@PostMapping("/create")
	public Map<String, Object> createWallet(HttpServletRequest request) {
		String token = requireBearer(request);
		return walletService.createWallet(
				requireUserId(request),
				(String) request.getAttribute("userEmail"),
				token);
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
