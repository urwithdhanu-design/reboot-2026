package com.gcul.claims.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.claims.model.ClaimQuery;
import com.gcul.claims.model.ClaimStatus;
import com.gcul.claims.model.InsuranceClaim;
import com.gcul.claims.repository.ClaimDocumentRepository;
import com.gcul.claims.repository.ClaimQueryRepository;
import com.gcul.claims.repository.ClaimRepository;

@Service
public class ClaimQueryService {

	private final ClaimRepository claims;
	private final ClaimQueryRepository queries;
	private final ClaimDocumentRepository documents;

	public ClaimQueryService(
			ClaimRepository claims,
			ClaimQueryRepository queries,
			ClaimDocumentRepository documents) {
		this.claims = claims;
		this.queries = queries;
		this.documents = documents;
	}

	@Transactional
	public Map<String, Object> createAdminQuery(String claimId, Map<String, Object> body) {
		InsuranceClaim claim = findClaim(claimId);
		assertQueryable(claim);

		String message = str(body.get("message"));
		if (message.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message is required");
		}
		boolean requiresDocuments = bool(body.get("requires_documents"));

		ClaimQuery query = new ClaimQuery();
		query.setId("CQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		query.setClaimId(claimId);
		query.setStatus("open");
		query.setAdminMessage(message);
		query.setRequiresDocuments(requiresDocuments);
		query.setCreatedAt(Instant.now());
		queries.save(query);

		claim.setStatus(ClaimStatus.AWAITING_CUSTOMER);
		claim.setUpdatedAt(Instant.now());
		claim.setValidationNotes(appendNote(claim.getValidationNotes(),
				"Admin query " + query.getId() + " sent to customer"));
		claims.save(claim);

		return toMap(query);
	}

	@Transactional
	public Map<String, Object> replyToQuery(String claimId, String queryId, Map<String, Object> body) {
		InsuranceClaim claim = findClaim(claimId);
		ClaimQuery query = queries.findByIdAndClaimId(queryId, claimId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Query not found"));
		if (!"open".equalsIgnoreCase(query.getStatus())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Query already answered");
		}

		String reply = str(body.get("message"));
		long docCount = documents.countByClaimIdAndQueryId(claimId, queryId);
		if (reply.isBlank()) {
			if (query.isRequiresDocuments() && docCount >= 1) {
				reply = "Please find the requested documents attached.";
			}
			else {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message is required");
			}
		}
		if (query.isRequiresDocuments() && docCount < 1) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Attach at least one document before submitting your reply");
		}

		query.setCustomerReply(reply);
		query.setStatus("answered");
		query.setAnsweredAt(Instant.now());
		queries.save(query);

		long open = queries.countByClaimIdAndStatus(claimId, "open");
		if (open == 0) {
			claim.setStatus(ClaimStatus.PENDING_APPROVAL);
			claim.setValidationNotes(appendNote(claim.getValidationNotes(),
					"Customer responded to all open queries"));
		}
		claim.setUpdatedAt(Instant.now());
		claims.save(claim);

		return toMap(query);
	}

	public List<Map<String, Object>> listForClaim(String claimId) {
		findClaim(claimId);
		return queries.findByClaimIdOrderByCreatedAtAsc(claimId).stream().map(this::toMap).toList();
	}

	public long countOpenForClaim(String claimId) {
		return queries.countByClaimIdAndStatus(claimId, "open");
	}

	public void assertNoOpenQueries(String claimId) {
		if (countOpenForClaim(claimId) > 0) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Resolve open customer queries before approving this claim");
		}
	}

	private InsuranceClaim findClaim(String claimId) {
		return claims.findById(claimId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId));
	}

	private static void assertQueryable(InsuranceClaim claim) {
		if (ClaimStatus.isTerminal(claim.getStatus())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Claim is already finalized");
		}
		if ("parametric".equalsIgnoreCase(claim.getSource())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Queries are not supported on parametric auto-claims");
		}
	}

	private Map<String, Object> toMap(ClaimQuery query) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", query.getId());
		map.put("claim_id", query.getClaimId());
		map.put("status", query.getStatus());
		map.put("admin_message", query.getAdminMessage());
		map.put("customer_reply", query.getCustomerReply());
		map.put("requires_documents", query.isRequiresDocuments());
		map.put("created_at", query.getCreatedAt().toString());
		map.put("answered_at", query.getAnsweredAt() == null ? null : query.getAnsweredAt().toString());
		map.put("document_count", documents.countByClaimIdAndQueryId(query.getClaimId(), query.getId()));
		return map;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static boolean bool(Object value) {
		if (value instanceof Boolean b) {
			return b;
		}
		return "true".equalsIgnoreCase(str(value)) || "yes".equalsIgnoreCase(str(value));
	}

	private static String appendNote(String existing, String note) {
		if (existing == null || existing.isBlank()) {
			return note;
		}
		return existing + " · " + note;
	}
}
