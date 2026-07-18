package com.gcul.policy.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.vendor.VendorService;

@RestController
@RequestMapping("/api")
public class VendorController {

	private final VendorService vendors;

	public VendorController(VendorService vendors) {
		this.vendors = vendors;
	}

	@GetMapping("/vendors")
	public Map<String, Object> list(@RequestParam(required = false) String status) {
		List<Map<String, Object>> items = vendors.listVendors(status);
		return Map.of("vendors", items, "count", items.size());
	}

	@GetMapping("/vendors/{id}")
	public Map<String, Object> get(@PathVariable String id) {
		return vendors.getVendor(id);
	}

	@PostMapping("/vendors/onboard")
	public Map<String, Object> onboard(@RequestBody Map<String, Object> body) {
		return vendors.onboard(body);
	}

	@PutMapping("/vendors/{id}")
	public Map<String, Object> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
		return vendors.updateVendor(id, body);
	}

	@PostMapping("/vendors/{id}/publish")
	public Map<String, Object> publish(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
		return vendors.publish(id, body == null ? Map.of() : body);
	}

	@PostMapping("/vendors/{id}/resend-invite")
	public Map<String, Object> resend(@PathVariable String id) {
		return vendors.resendInvite(id);
	}

	@PostMapping("/vendor-portal/login")
	public Map<String, Object> login(@RequestBody Map<String, Object> body) {
		Object email = body.get("email");
		Object password = body.get("password");
		if (email == null || password == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email and password are required");
		}
		return vendors.vendorLogin(String.valueOf(email), String.valueOf(password));
	}

	@GetMapping("/vendor-portal/dashboard")
	public Map<String, Object> dashboard(@RequestHeader(value = "Authorization", required = false) String auth) {
		return vendors.vendorDashboard(auth);
	}
}
