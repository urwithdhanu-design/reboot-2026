package com.gcul.policy.vendor;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.mail.MailService;
import com.gcul.policy.model.InsurancePlan;
import com.gcul.policy.repository.InsurancePlanRepository;

@Service
public class VendorService {

	private final InsuranceVendorRepository vendors;
	private final VendorAccountRepository accounts;
	private final InsurancePlanRepository plans;
	private final MailService mail;
	private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder();
	private final SecureRandom random = new SecureRandom();
	private final Map<String, Map<String, Object>> vendorSessions = new ConcurrentHashMap<>();

	public VendorService(
			InsuranceVendorRepository vendors,
			VendorAccountRepository accounts,
			InsurancePlanRepository plans,
			MailService mail) {
		this.vendors = vendors;
		this.accounts = accounts;
		this.plans = plans;
		this.mail = mail;
	}

	@Transactional(readOnly = true)
	public List<Map<String, Object>> listVendors(String status) {
		List<InsuranceVendor> list = status == null || status.isBlank() || "all".equalsIgnoreCase(status)
				? vendors.findAllByOrderByCreatedAtDesc()
				: vendors.findByStatusIgnoreCaseOrderByCreatedAtDesc(status.trim());
		return list.stream().map(this::toPublic).collect(Collectors.toList());
	}

	@Transactional(readOnly = true)
	public Map<String, Object> getVendor(String id) {
		return toPublic(requireVendor(id));
	}

	@Transactional
	public Map<String, Object> onboard(Map<String, Object> body) {
		String name = required(body, "name");
		String code = required(body, "code").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "-");
		String email = required(body, "contact_email").trim().toLowerCase(Locale.ROOT);
		String categories = str(body.get("categories"), "Health");
		String contactName = str(body.get("contact_name"), name);

		if (vendors.findByCodeIgnoreCase(code).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor code already exists: " + code);
		}
		if (accounts.findByEmailIgnoreCase(email).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "A vendor login already exists for " + email);
		}

		InsuranceVendor vendor = new InsuranceVendor();
		vendor.setId("vnd-" + UUID.randomUUID().toString().substring(0, 8));
		vendor.setName(name);
		vendor.setCode(code);
		vendor.setCategories(categories);
		vendor.setContactEmail(email);
		vendor.setContactName(contactName);
		vendor.setDescription(str(body.get("description"), ""));
		vendor.setWebsiteUrl(str(body.get("website_url"), ""));
		vendor.setStatus("invited");
		vendor.setCreatedAt(Instant.now().toString());
		vendor.setUpdatedAt(vendor.getCreatedAt());
		vendors.save(vendor);

		String tempPassword = generatePassword();
		VendorAccount account = new VendorAccount();
		account.setId("vac-" + UUID.randomUUID().toString().substring(0, 8));
		account.setVendorId(vendor.getId());
		account.setEmail(email);
		account.setFullName(contactName);
		account.setPasswordHash(passwords.encode(tempPassword));
		account.setRole("vendor_admin");
		account.setCreatedAt(Instant.now().toString());
		accounts.save(account);

		mail.sendVendorInvite(email, contactName, vendor.getName(), email, tempPassword, vendor.getCode());

		Map<String, Object> response = toPublic(vendor);
		response.put("credentials_emailed", true);
		response.put("temp_password_hint", "Sent to " + email + " (also returned once for admin demo)");
		response.put("temp_password", tempPassword);
		return response;
	}

	@Transactional
	public Map<String, Object> updateVendor(String id, Map<String, Object> body) {
		InsuranceVendor vendor = requireVendor(id);
		if (body.containsKey("name")) {
			vendor.setName(required(body, "name"));
		}
		if (body.containsKey("categories")) {
			vendor.setCategories(str(body.get("categories"), vendor.getCategories()));
		}
		if (body.containsKey("contact_email")) {
			vendor.setContactEmail(required(body, "contact_email").toLowerCase(Locale.ROOT));
		}
		if (body.containsKey("contact_name")) {
			vendor.setContactName(str(body.get("contact_name"), vendor.getContactName()));
		}
		if (body.containsKey("description")) {
			vendor.setDescription(str(body.get("description"), ""));
		}
		if (body.containsKey("website_url")) {
			vendor.setWebsiteUrl(str(body.get("website_url"), ""));
		}
		if (body.containsKey("status")) {
			vendor.setStatus(str(body.get("status"), vendor.getStatus()));
		}
		vendor.setUpdatedAt(Instant.now().toString());
		vendors.save(vendor);
		return toPublic(vendor);
	}

	@Transactional
	public Map<String, Object> publish(String id, Map<String, Object> body) {
		InsuranceVendor vendor = requireVendor(id);
		String uiUrl = str(body.get("ui_deploy_url"),
				"https://vendors.reboot2026.local/" + vendor.getCode());
		String version = str(body.get("ui_version"), "1.0.0");
		String servicesJson = str(body.get("services_config_json"),
				defaultServicesConfig(vendor));

		vendor.setUiDeployUrl(uiUrl);
		vendor.setUiVersion(version);
		vendor.setServicesConfigJson(servicesJson);
		vendor.setPublishedAt(Instant.now().toString());
		vendor.setStatus("active");
		vendor.setUpdatedAt(Instant.now().toString());
		vendors.save(vendor);

		mail.sendVendorPublished(
				vendor.getContactEmail(),
				vendor.getContactName(),
				vendor.getName(),
				uiUrl,
				version);

		Map<String, Object> response = toPublic(vendor);
		response.put("published", true);
		return response;
	}

	@Transactional
	public Map<String, Object> resendInvite(String id) {
		InsuranceVendor vendor = requireVendor(id);
		VendorAccount account = accounts.findByVendorId(vendor.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor login not found"));
		String tempPassword = generatePassword();
		account.setPasswordHash(passwords.encode(tempPassword));
		accounts.save(account);
		mail.sendVendorInvite(
				account.getEmail(),
				account.getFullName(),
				vendor.getName(),
				account.getEmail(),
				tempPassword,
				vendor.getCode());
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("ok", true);
		response.put("emailed_to", account.getEmail());
		response.put("temp_password", tempPassword);
		return response;
	}

	@Transactional
	public Map<String, Object> vendorLogin(String email, String password) {
		VendorAccount account = accounts.findByEmailIgnoreCase(email.trim())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid vendor credentials"));
		if (!passwords.matches(password, account.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid vendor credentials");
		}
		InsuranceVendor vendor = requireVendor(account.getVendorId());
		account.setLastLoginAt(Instant.now().toString());
		accounts.save(account);

		String token = "vtok-" + UUID.randomUUID();
		Map<String, Object> session = new LinkedHashMap<>();
		session.put("token", token);
		session.put("vendor_id", vendor.getId());
		session.put("account_id", account.getId());
		session.put("email", account.getEmail());
		vendorSessions.put(token, session);

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("access_token", token);
		response.put("token_type", "bearer");
		response.put("vendor", toPublic(vendor));
		response.put("account", Map.of(
				"id", account.getId(),
				"email", account.getEmail(),
				"full_name", account.getFullName() == null ? "" : account.getFullName(),
				"role", account.getRole()));
		return response;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> vendorDashboard(String bearerToken) {
		Map<String, Object> session = requireSession(bearerToken);
		String vendorId = String.valueOf(session.get("vendor_id"));
		InsuranceVendor vendor = requireVendor(vendorId);

		List<InsurancePlan> linkedPlans = plans.findAll().stream()
				.filter(p -> matchesVendor(p, vendor))
				.collect(Collectors.toList());

		Map<String, Object> dashboard = new LinkedHashMap<>();
		dashboard.put("vendor", toPublic(vendor));
		dashboard.put("products", linkedPlans.stream().map(this::planSummary).collect(Collectors.toList()));
		dashboard.put("customers", demoCustomers(vendor));
		dashboard.put("claims", demoClaims(vendor));
		dashboard.put("stats", Map.of(
				"products", linkedPlans.size(),
				"customers", 3,
				"open_claims", 1,
				"status", vendor.getStatus()));
		return dashboard;
	}

	private boolean matchesVendor(InsurancePlan plan, InsuranceVendor vendor) {
		String cats = vendor.getCategories() == null ? "" : vendor.getCategories().toLowerCase(Locale.ROOT);
		String planCat = plan.getCategory() == null ? "" : plan.getCategory().toLowerCase(Locale.ROOT);
		if (cats.contains(planCat)) {
			return true;
		}
		String code = vendor.getCode() == null ? "" : vendor.getCode().toLowerCase(Locale.ROOT);
		String title = plan.getTitle() == null ? "" : plan.getTitle().toLowerCase(Locale.ROOT);
		return title.contains(code) || ("vitality".equals(code) && title.contains("health"));
	}

	private Map<String, Object> planSummary(InsurancePlan plan) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", plan.getId());
		map.put("title", plan.getTitle());
		map.put("category", plan.getCategory());
		map.put("price_from", plan.getPriceFrom());
		map.put("price_unit", plan.getPriceUnit());
		return map;
	}

	private List<Map<String, Object>> demoCustomers(InsuranceVendor vendor) {
		List<Map<String, Object>> list = new ArrayList<>();
		list.add(Map.of(
				"id", "cust-1",
				"name", "Alex Morgan",
				"email", "alex.morgan@email.com",
				"product", vendor.getCategories().contains("Health") ? "Health Plan" : vendor.getName() + " Cover",
				"status", "active"));
		list.add(Map.of(
				"id", "cust-2",
				"name", "Priya Shah",
				"email", "priya.shah@email.com",
				"product", vendor.getName() + " Cover",
				"status", "quote"));
		list.add(Map.of(
				"id", "cust-3",
				"name", "James Okafor",
				"email", "james.o@email.com",
				"product", vendor.getName() + " Cover",
				"status", "active"));
		return list;
	}

	private List<Map<String, Object>> demoClaims(InsuranceVendor vendor) {
		return List.of(
				Map.of(
						"id", "clm-1001",
						"customer", "Alex Morgan",
						"type", "Treatment reimbursement",
						"amount", 420.0,
						"status", "open",
						"vendor", vendor.getName()),
				Map.of(
						"id", "clm-1002",
						"customer", "James Okafor",
						"type", "GP referral",
						"amount", 85.0,
						"status", "paid",
						"vendor", vendor.getName()));
	}

	private Map<String, Object> requireSession(String bearerToken) {
		if (bearerToken == null || bearerToken.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing vendor token");
		}
		String token = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7).trim() : bearerToken.trim();
		Map<String, Object> session = vendorSessions.get(token);
		if (session == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired vendor session");
		}
		return session;
	}

	private InsuranceVendor requireVendor(String id) {
		return vendors.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
	}

	private Map<String, Object> toPublic(InsuranceVendor vendor) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", vendor.getId());
		map.put("name", vendor.getName());
		map.put("code", vendor.getCode());
		map.put("categories", vendor.getCategories());
		map.put("contact_email", vendor.getContactEmail());
		map.put("contact_name", vendor.getContactName());
		map.put("status", vendor.getStatus());
		map.put("description", vendor.getDescription());
		map.put("website_url", vendor.getWebsiteUrl());
		map.put("ui_deploy_url", vendor.getUiDeployUrl());
		map.put("ui_version", vendor.getUiVersion());
		map.put("services_config_json", vendor.getServicesConfigJson());
		map.put("published_at", vendor.getPublishedAt());
		map.put("created_at", vendor.getCreatedAt());
		map.put("updated_at", vendor.getUpdatedAt());
		return map;
	}

	private static String defaultServicesConfig(InsuranceVendor vendor) {
		return "{\"vendor_code\":\"" + vendor.getCode()
				+ "\",\"apis\":[\"/api/quotes\",\"/api/products\"],\"categories\":\""
				+ vendor.getCategories() + "\"}";
	}

	private String generatePassword() {
		String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
		StringBuilder sb = new StringBuilder("Vnd!");
		for (int i = 0; i < 10; i++) {
			sb.append(chars.charAt(random.nextInt(chars.length())));
		}
		return sb.toString();
	}

	private static String required(Map<String, Object> body, String key) {
		Object value = body.get(key);
		if (value == null || String.valueOf(value).isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " is required");
		}
		return String.valueOf(value).trim();
	}

	private static String str(Object value, String fallback) {
		if (value == null || String.valueOf(value).isBlank()) {
			return fallback;
		}
		return String.valueOf(value).trim();
	}
}
