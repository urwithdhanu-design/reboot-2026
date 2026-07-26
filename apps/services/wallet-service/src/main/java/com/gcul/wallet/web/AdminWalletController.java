package com.gcul.wallet.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.wallet.admin.AdminWalletService;

@RestController
@RequestMapping("/api/admin/wallet-ops")
public class AdminWalletController {

	private final AdminWalletService adminWalletService;

	public AdminWalletController(AdminWalletService adminWalletService) {
		this.adminWalletService = adminWalletService;
	}

	@GetMapping
	public Map<String, Object> view() {
		return adminWalletService.view();
	}
}
