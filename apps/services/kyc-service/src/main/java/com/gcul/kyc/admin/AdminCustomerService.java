package com.gcul.kyc.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.dto.UserMapper;
import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.repository.UserAccountRepository;

@Service
public class AdminCustomerService {

	private final UserAccountRepository repository;

	public AdminCustomerService(UserAccountRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> listCustomers(String search, String kycStatus) {
		List<UserAccount> users = repository.searchAdmin(normalize(search), normalizeKyc(kycStatus));
		List<Map<String, Object>> items = users.stream().map(this::toAdminRow).toList();
		return Map.of("customers", items, "count", items.size());
	}

	@Transactional(readOnly = true)
	public Map<String, Object> kycQueue() {
		List<UserAccount> users = repository.findByKycStatusOrderByKycSubmittedAtDesc("in_progress");
		List<Map<String, Object>> items = users.stream().map(this::toKycQueueItem).toList();
		return Map.of("queue", items, "count", items.size());
	}

	@Transactional(readOnly = true)
	public Map<String, Object> stats() {
		long total = repository.count();
		long verified = repository.countByKycStatus("verified");
		long inProgress = repository.countByKycStatus("in_progress");
		long notStarted = repository.countByKycStatus("not_started");
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("total_customers", total);
		map.put("kyc_verified", verified);
		map.put("kyc_in_progress", inProgress);
		map.put("kyc_not_started", notStarted);
		return map;
	}

	@Transactional
	public Map<String, Object> updateKycStatus(String userId, String status) {
		String normalized = status == null ? "" : status.trim().toLowerCase(Locale.ROOT);
		if (!List.of("verified", "rejected", "in_progress", "not_started").contains(normalized)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"status must be verified, rejected, in_progress, or not_started");
		}
		UserAccount user = repository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
		user.setKycStatus(normalized);
		repository.save(user);
		return toAdminRow(user);
	}

	private Map<String, Object> toAdminRow(UserAccount user) {
		Map<String, Object> map = new LinkedHashMap<>(UserMapper.toPublic(user));
		map.put("created_at", user.getCreatedAt());
		map.put("kyc_document_type", user.getKycDocumentType() == null ? "" : user.getKycDocumentType());
		map.put("kyc_submitted_at", user.getKycSubmittedAt() == null ? "" : user.getKycSubmittedAt());
		map.put("wallet_status", user.getWalletStatus() == null ? "none" : user.getWalletStatus());
		map.put("account_status", accountStatus(user));
		return map;
	}

	private Map<String, Object> toKycQueueItem(UserAccount user) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", user.getId());
		map.put("customer_name", user.getFullName());
		map.put("email", user.getEmail());
		map.put("mobile_number", user.getMobileNumber());
		map.put("status", user.getKycStatus());
		map.put("document_type", user.getKycDocumentType() == null ? "" : user.getKycDocumentType());
		map.put("submitted_at", user.getKycSubmittedAt() == null ? user.getCreatedAt() : user.getKycSubmittedAt());
		map.put("progress", UserMapper.fromJsonMap(user.getKycProgressJson()));
		map.put("documents", documentLabels(user));
		return map;
	}

	private List<String> documentLabels(UserAccount user) {
		String type = user.getKycDocumentType();
		if (type == null || type.isBlank()) {
			return List.of("Identity document (pending)");
		}
		return List.of(type + " — uploaded", "Selfie / liveness check");
	}

	private static String accountStatus(UserAccount user) {
		if ("verified".equals(user.getKycStatus())) {
			return "active";
		}
		if ("in_progress".equals(user.getKycStatus())) {
			return "pending_kyc";
		}
		if ("rejected".equals(user.getKycStatus())) {
			return "suspended";
		}
		return "registered";
	}

	private static String normalize(String q) {
		return q == null || q.isBlank() ? null : q.trim();
	}

	private static String normalizeKyc(String kyc) {
		if (kyc == null || kyc.isBlank() || "all".equalsIgnoreCase(kyc)) {
			return null;
		}
		return kyc.trim();
	}
}
