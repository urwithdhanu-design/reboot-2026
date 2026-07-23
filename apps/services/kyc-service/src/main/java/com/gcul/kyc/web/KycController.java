package com.gcul.kyc.web;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.dto.KycSubmitRequest;
import com.gcul.kyc.dto.UserMapper;
import com.gcul.kyc.messaging.CustomerEventPublisher;
import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.store.UserStore;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/kyc")
public class KycController {

	private final UserStore store;
	private final CustomerEventPublisher customerEvents;

	public KycController(UserStore store, CustomerEventPublisher customerEvents) {
		this.store = store;
		this.customerEvents = customerEvents;
	}

	@PostMapping("/submit")
	public Map<String, Object> submit(@Valid @RequestBody KycSubmitRequest body, HttpServletRequest request) {
		UserAccount user = requireUser(request);

		Map<String, String> progress = new LinkedHashMap<>();
		progress.put("identity", "done");
		progress.put("verify", body.isDocumentUploaded() ? "done" : "pending");
		progress.put("liveness", body.isSelfieCaptured() ? "done" : "pending");
		progress.put("complete",
				body.isDocumentUploaded() && body.isSelfieCaptured() ? "done" : "pending");

		String status = "done".equals(progress.get("complete")) ? "verified" : "in_progress";

		user.setKycStatus(status);
		user.setKycDocumentType(body.getDocumentType());
		user.setKycProgressJson(UserMapper.toJson(progress));
		user.setKycSubmittedAt(Instant.now().toString());
		store.save(user);

		if ("verified".equals(status)) {
			customerEvents.customerVerified(user);
		}

		return Map.of("status", status, "progress", progress);
	}

	@GetMapping("/status")
	public Map<String, Object> status(HttpServletRequest request) {
		UserAccount user = requireUser(request);
		if (user.getKycStatus() == null || "not_started".equals(user.getKycStatus())) {
			return Map.of(
					"status", "not_started",
					"progress", Map.of(
							"identity", "pending",
							"verify", "pending",
							"liveness", "pending",
							"complete", "pending"));
		}
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("status", user.getKycStatus());
		response.put("progress", UserMapper.fromJsonMap(user.getKycProgressJson()));
		response.put("document_type", user.getKycDocumentType() == null ? "" : user.getKycDocumentType());
		return response;
	}

	private UserAccount requireUser(HttpServletRequest request) {
		Object attr = request.getAttribute("currentUser");
		if (attr instanceof UserAccount user) {
			return user;
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
	}
}
