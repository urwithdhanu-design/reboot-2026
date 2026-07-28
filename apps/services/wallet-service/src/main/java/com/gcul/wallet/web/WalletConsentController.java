package com.gcul.wallet.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.wallet.service.WalletConsentService;

@RestController
@RequestMapping("/api/wallet/consent")
public class WalletConsentController {

	private final WalletConsentService consentService;

	public WalletConsentController(WalletConsentService consentService) {
		this.consentService = consentService;
	}

	@GetMapping("/approve")
	public Map<String, Object> approveGet(@RequestParam("token") String token) {
		return consentService.approveByToken(token);
	}

	@PostMapping("/approve")
	public Map<String, Object> approvePost(@RequestParam("token") String token) {
		return consentService.approveByToken(token);
	}
}
