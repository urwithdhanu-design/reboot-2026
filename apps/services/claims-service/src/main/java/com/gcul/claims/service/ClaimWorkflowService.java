package com.gcul.claims.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.claims.messaging.ClaimEventPublisher;
import com.gcul.claims.model.InsuranceClaim;
import com.gcul.claims.repository.ClaimRepository;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;

@Service
@Order(1)
public class ClaimWorkflowService implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ClaimWorkflowService.class);

	private static final Set<String> STATUSES = Set.of(
			"submitted", "in_review", "approved", "rejected", "paid");

	private final ClaimRepository repo;
	private final ClaimEventPublisher claimEvents;
	private final JdbcTemplate jdbc;
	private final ObjectProvider<ClaimWorkflowService> self;

	private String descriptionSelectSql = "COALESCE(description::text, '')";

	public ClaimWorkflowService(
			ClaimRepository repo,
			ClaimEventPublisher claimEvents,
			JdbcTemplate jdbc,
			ObjectProvider<ClaimWorkflowService> self) {
		this.repo = repo;
		this.claimEvents = claimEvents;
		this.jdbc = jdbc;
		this.self = self;
	}

	@Override
	public void run(ApplicationArguments args) {
		initDescriptionReader();
	}

	void initDescriptionReader() {
		try {
			Integer oidCols = jdbc.queryForObject(
					"""
							SELECT COUNT(*) FROM information_schema.columns
							WHERE table_name = 'insurance_claims'
							  AND column_name = 'description'
							  AND udt_name = 'oid'
							""",
					Integer.class);
			if (oidCols != null && oidCols > 0) {
				descriptionSelectSql = "convert_from(lo_get(description), 'UTF8')";
				log.info("insurance_claims.description is OID; using lo_get reader");
			}
		}
		catch (Exception ex) {
			log.debug("Could not detect description column type: {}", ex.getMessage());
		}
	}

	@Transactional
	public Map<String, Object> create(Map<String, Object> body) {
		String policyRef = str(body.get("policy_ref"));
		if (policyRef.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policy_ref is required");
		}
		InsuranceClaim claim = new InsuranceClaim();
		claim.setId("CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		claim.setPolicyRef(policyRef);
		claim.setCustomerName(firstNonBlank(str(body.get("customer_name")), "Customer"));
		claim.setCategory(firstNonBlank(str(body.get("category")), "General"));
		claim.setAmountClaimed(num(body.get("amount_claimed"), 0));
		claim.setDescription(str(body.get("description")));
		claim.setSource(firstNonBlank(str(body.get("source")), "manual"));
		claim.setStatus("submitted");
		claim.setCreatedAt(Instant.now());
		claim.setUpdatedAt(Instant.now());
		InsuranceClaim saved = repo.save(claim);
		claimEvents.claimRequested(saved);
		return toMap(saved);
	}

	public List<Map<String, Object>> list(String status) {
		try {
			return listViaJdbc(status);
		}
		catch (Exception ex) {
			log.warn("JDBC claim list failed ({}), falling back to JPA", ex.getMessage());
			return self.getObject().listViaJpa(status);
		}
	}

	public List<Map<String, Object>> listViaJdbc(String status) {
		String sql = listSql() + (status == null || status.isBlank() ? "" : " WHERE status = ?")
				+ " ORDER BY created_at DESC";
		if (status == null || status.isBlank()) {
			return jdbc.query(sql, claimRowMapper());
		}
		return jdbc.query(sql, claimRowMapper(), status);
	}

	@Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
	public List<Map<String, Object>> listViaJpa(String status) {
		List<InsuranceClaim> rows = status == null || status.isBlank()
				? repo.findAllByOrderByCreatedAtDesc()
				: repo.findByStatusOrderByCreatedAtDesc(status);
		return rows.stream().map(this::toMap).toList();
	}

	public Map<String, Object> get(String id) {
		try {
			List<Map<String, Object>> rows = jdbc.query(
					listSql() + " WHERE id = ?",
					claimRowMapper(),
					id);
			if (rows.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found");
			}
			return rows.get(0);
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (Exception ex) {
			return self.getObject().getViaJpa(id);
		}
	}

	@Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
	public Map<String, Object> getViaJpa(String id) {
		return toMap(find(id));
	}

	@Transactional
	public Map<String, Object> updateStatus(String id, Map<String, Object> body) {
		String status = str(body.get("status")).toLowerCase(Locale.ROOT);
		if (!STATUSES.contains(status)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
		}
		int updated = jdbc.update(
				"UPDATE insurance_claims SET status = ?, updated_at = ? WHERE id = ?",
				status,
				java.sql.Timestamp.from(Instant.now()),
				id);
		if (updated == 0) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found");
		}
		Map<String, Object> claim = get(id);
		if ("approved".equals(status)) {
			claimEvents.claimApproved(toEntity(claim));
		}
		return claim;
	}

	private String listSql() {
		return """
				SELECT id, policy_ref, customer_name, category, status, amount_claimed,
				       %s AS description,
				       source, created_at, updated_at
				FROM insurance_claims
				""".formatted(descriptionSelectSql);
	}

	private RowMapper<Map<String, Object>> claimRowMapper() {
		return (rs, rowNum) -> rowToMap(rs);
	}

	private Map<String, Object> rowToMap(ResultSet rs) throws SQLException {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", rs.getString("id"));
		map.put("policy_ref", rs.getString("policy_ref"));
		map.put("customer_name", rs.getString("customer_name"));
		map.put("category", rs.getString("category"));
		map.put("status", rs.getString("status"));
		map.put("amount_claimed", rs.getDouble("amount_claimed"));
		map.put("description", rs.getString("description"));
		map.put("source", rs.getString("source"));
		map.put("created_at", rs.getTimestamp("created_at").toInstant().toString());
		var updated = rs.getTimestamp("updated_at");
		map.put("updated_at", updated == null ? null : updated.toInstant().toString());
		return map;
	}

	private InsuranceClaim toEntity(Map<String, Object> map) {
		InsuranceClaim claim = new InsuranceClaim();
		claim.setId(str(map.get("id")));
		claim.setPolicyRef(str(map.get("policy_ref")));
		claim.setCustomerName(str(map.get("customer_name")));
		claim.setCategory(str(map.get("category")));
		claim.setStatus(str(map.get("status")));
		claim.setAmountClaimed(num(map.get("amount_claimed"), 0));
		claim.setDescription(str(map.get("description")));
		claim.setSource(str(map.get("source")));
		return claim;
	}

	private InsuranceClaim find(String id) {
		return repo.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
	}

	private Map<String, Object> toMap(InsuranceClaim c) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", c.getId());
		map.put("policy_ref", c.getPolicyRef());
		map.put("customer_name", c.getCustomerName());
		map.put("category", c.getCategory());
		map.put("status", c.getStatus());
		map.put("amount_claimed", c.getAmountClaimed());
		map.put("description", c.getDescription());
		map.put("source", c.getSource());
		map.put("created_at", c.getCreatedAt().toString());
		map.put("updated_at", c.getUpdatedAt() == null ? null : c.getUpdatedAt().toString());
		return map;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static double num(Object value, double fallback) {
		try {
			return Double.parseDouble(String.valueOf(value));
		} catch (Exception ex) {
			return fallback;
		}
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) return value;
		}
		return "";
	}
}
