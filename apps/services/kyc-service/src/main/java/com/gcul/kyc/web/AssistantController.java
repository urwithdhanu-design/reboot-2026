package com.gcul.kyc.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

	private static final Map<String, String> MESSAGES = Map.of(
			"register", "Welcome! Let's create your insurance experience.",
			"login", "Good to see you again! Your policies are safe and secure.",
			"forgot", "Enter your email or phone and we'll help you reset your password.",
			"reset", "Choose a strong new password to get back into your account.",
			"kyc", "We will need your valid documents. All verified securely.",
			"wallet", "Your account is ready. Keep your details safe.",
			"marketplace", "Browse cover that fits your life. Ask if you need help choosing.");

	@GetMapping("/message")
	public Map<String, String> message(@RequestParam(defaultValue = "register") String screen) {
		String key = screen.toLowerCase().trim();
		return Map.of(
				"title", "Insurance Support Assistant",
				"message", MESSAGES.getOrDefault(key, MESSAGES.get("register")),
				"screen", key);
	}
}
