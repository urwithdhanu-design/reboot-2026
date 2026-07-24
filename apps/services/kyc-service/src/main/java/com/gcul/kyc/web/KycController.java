package com.gcul.kyc.web;

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
import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.service.KycSubmissionService;
import com.gcul.kyc.store.UserStore;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/kyc")
public class KycController {

	private final UserStore store;
	private final KycSubmissionService submissions;

	public KycController(UserStore store, KycSubmissionService submissions) {
		this.store = store;
		this.submissions = submissions;
	}

	@PostMapping("/submit")
	public Map<String, Object> submit(@Valid @RequestBody KycSubmitRequest body, HttpServletRequest request) {
		UserAccount user = requireUser(request);
		return submissions.submit(user, body);
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
