package com.gcul.wallet.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.wallet.admin.AdminWalletService;
import com.gcul.wallet.service.ClaimsPoolService;

@RestController
@RequestMapping("/api/admin/wallet-ops")
public class AdminWalletController {

	private final AdminWalletService adminWalletService;
	private final ClaimsPoolService claimsPool;

	public AdminWalletController(AdminWalletService adminWalletService, ClaimsPoolService claimsPool) {
		this.adminWalletService = adminWalletService;
		this.claimsPool = claimsPool;
	}

	@GetMapping
	public Map<String, Object> view() {
		return adminWalletService.view();
	}

	@PostMapping("/claims-pool/top-up")
	public Map<String, Object> topUpClaimsPool(@RequestBody Map<String, Object> body) {
		double amount = parseAmount(body.get("amount"));
		String reference = body.get("reference") == null ? null : String.valueOf(body.get("reference"));
		String source = body.get("source") == null ? null : String.valueOf(body.get("source"));
		return claimsPool.topUp(amount, reference, source);
	}

	private static double parseAmount(Object raw) {
		if (raw instanceof Number number) {
			return number.doubleValue();
		}
		if (raw == null) {
			return 0;
		}
		return Double.parseDouble(String.valueOf(raw));
	}
}
