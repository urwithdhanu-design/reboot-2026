package com.gcul.kyc.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.repository.UserAccountRepository;

@RestController
@RequestMapping("/api/internal/kyc")
public class InternalKycController {

	private final UserAccountRepository users;

	public InternalKycController(UserAccountRepository users) {
		this.users = users;
	}

	@GetMapping("/status")
	public Map<String, Object> status(@RequestParam String customerId) {
		if (customerId == null || customerId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "customerId is required");
		}
		return users.findById(customerId.trim())
				.or(() -> users.findByEmailIgnoreCase(customerId.trim()))
				.map(user -> Map.<String, Object>of(
						"customerId", user.getId(),
						"email", user.getEmail(),
						"status", user.getKycStatus() == null ? "not_started" : user.getKycStatus()))
				.orElse(Map.of("customerId", customerId, "status", "not_started"));
	}
}
