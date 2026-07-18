package com.gcul.kyc.web;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.store.UserStore;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

	private final UserStore store;
	private final SecureRandom random = new SecureRandom();

	public WalletController(UserStore store) {
		this.store = store;
	}

	@GetMapping
	public Map<String, Object> getWallet(HttpServletRequest request) {
		UserAccount user = requireUser(request);
		Map<String, Object> result = new LinkedHashMap<>();
		if (!user.hasConnectedWallet()) {
			result.put("status", "disconnected");
			result.put("address", null);
			return result;
		}
		result.put("status", user.getWalletStatus());
		result.put("address", user.getWalletAddress());
		result.put("provider", user.getWalletProvider() == null ? "secure_wallet" : user.getWalletProvider());
		result.put("mode", user.getWalletMode() == null ? "demo" : user.getWalletMode());
		return result;
	}

	@PostMapping("/create")
	public Map<String, Object> createWallet(HttpServletRequest request) {
		UserAccount user = requireUser(request);

		if (user.hasConnectedWallet()) {
			Map<String, Object> existing = new LinkedHashMap<>();
			existing.put("address", user.getWalletAddress());
			existing.put("status", user.getWalletStatus());
			existing.put("provider", user.getWalletProvider());
			existing.put("mode", user.getWalletMode());
			existing.put("note", user.getWalletNote());
			existing.put("reused", true);
			return existing;
		}

		if (!"verified".equals(user.getKycStatus())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Complete KYC verification before creating a wallet");
		}

		String seed = user.getId() + ":" + user.getEmail() + ":" + HexFormat.of().formatHex(randomBytes(4));
		String digest = sha256(seed);
		String address = "0x" + digest.substring(0, 4) + "..." + digest.substring(digest.length() - 6);

		user.setWalletAddress(address);
		user.setWalletStatus("connected");
		user.setWalletProvider("secure_wallet");
		user.setWalletMode("demo");
		user.setWalletNote("Demo digital account for policy storage and payouts.");
		store.save(user);

		Map<String, Object> wallet = new LinkedHashMap<>();
		wallet.put("address", address);
		wallet.put("status", "connected");
		wallet.put("provider", "secure_wallet");
		wallet.put("ledger", "gcul");
		wallet.put("mode", "demo");
		wallet.put("note", user.getWalletNote());
		wallet.put("reused", false);
		return wallet;
	}

	private UserAccount requireUser(HttpServletRequest request) {
		Object attr = request.getAttribute("currentUser");
		if (attr instanceof UserAccount user) {
			return user;
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
	}

	private byte[] randomBytes(int len) {
		byte[] bytes = new byte[len];
		random.nextBytes(bytes);
		return bytes;
	}

	private String sha256(String value) {
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Wallet address failed");
		}
	}
}
