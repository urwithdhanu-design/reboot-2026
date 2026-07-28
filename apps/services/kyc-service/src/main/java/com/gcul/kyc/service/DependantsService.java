package com.gcul.kyc.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.dto.DependantRequest;
import com.gcul.kyc.model.UserDependant;
import com.gcul.kyc.repository.UserDependantRepository;

@Service
public class DependantsService {

	private static final Set<String> RELATIONSHIPS = Set.of(
			"spouse", "partner", "child", "parent", "other");

	private final UserDependantRepository repository;

	public DependantsService(UserDependantRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> list(String userId) {
		List<Map<String, Object>> rows = repository.findByUserIdOrderByCreatedAtAsc(userId).stream()
				.map(this::toResponse)
				.toList();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("dependants", rows);
		result.put("count", rows.size());
		return result;
	}

	@Transactional
	public Map<String, Object> create(String userId, DependantRequest body) {
		UserDependant row = new UserDependant();
		row.setId(UUID.randomUUID().toString());
		row.setUserId(userId);
		applyFields(row, body);
		String now = Instant.now().toString();
		row.setCreatedAt(now);
		row.setUpdatedAt(now);
		return toResponse(repository.save(row));
	}

	@Transactional
	public Map<String, Object> update(String userId, String id, DependantRequest body) {
		UserDependant row = requireOwned(userId, id);
		applyFields(row, body);
		row.setUpdatedAt(Instant.now().toString());
		return toResponse(repository.save(row));
	}

	@Transactional
	public Map<String, Object> delete(String userId, String id) {
		UserDependant row = requireOwned(userId, id);
		repository.delete(row);
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("deleted", true);
		result.put("id", row.getId());
		return result;
	}

	private UserDependant requireOwned(String userId, String id) {
		return repository.findByIdAndUserId(id, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dependant not found"));
	}

	private void applyFields(UserDependant row, DependantRequest body) {
		String name = body.getFullName() == null ? "" : body.getFullName().trim();
		if (name.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name is required");
		}
		row.setFullName(name);

		String dob = body.getDateOfBirth() == null ? "" : body.getDateOfBirth().trim();
		if (!dob.matches("\\d{4}-\\d{2}-\\d{2}")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth must be YYYY-MM-DD");
		}
		row.setDateOfBirth(dob);

		String relationship = normalizeRelationship(body.getRelationship());
		if (!RELATIONSHIPS.contains(relationship)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Relationship must be spouse, partner, child, parent, or other");
		}
		row.setRelationship(relationship);
	}

	private static String normalizeRelationship(String value) {
		if (value == null) {
			return "";
		}
		return value.trim().toLowerCase(Locale.ROOT);
	}

	private Map<String, Object> toResponse(UserDependant row) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", row.getId());
		map.put("full_name", row.getFullName());
		map.put("date_of_birth", row.getDateOfBirth());
		map.put("relationship", row.getRelationship());
		map.put("created_at", row.getCreatedAt());
		if (row.getUpdatedAt() != null) {
			map.put("updated_at", row.getUpdatedAt());
		}
		return map;
	}
}
