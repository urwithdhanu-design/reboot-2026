package com.gcul.kyc.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.dto.DependantRequest;
import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.service.DependantsService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profile/dependants")
public class DependantsController {

	private final DependantsService dependants;

	public DependantsController(DependantsService dependants) {
		this.dependants = dependants;
	}

	@GetMapping
	public Map<String, Object> list(HttpServletRequest request) {
		return dependants.list(requireUser(request).getId());
	}

	@PostMapping
	public Map<String, Object> create(
			@Valid @RequestBody DependantRequest body,
			HttpServletRequest request) {
		return dependants.create(requireUser(request).getId(), body);
	}

	@PutMapping("/{id}")
	public Map<String, Object> update(
			@PathVariable String id,
			@Valid @RequestBody DependantRequest body,
			HttpServletRequest request) {
		return dependants.update(requireUser(request).getId(), id, body);
	}

	@DeleteMapping("/{id}")
	public Map<String, Object> delete(@PathVariable String id, HttpServletRequest request) {
		return dependants.delete(requireUser(request).getId(), id);
	}

	private UserAccount requireUser(HttpServletRequest request) {
		Object attr = request.getAttribute("currentUser");
		if (attr instanceof UserAccount user) {
			return user;
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
	}
}
