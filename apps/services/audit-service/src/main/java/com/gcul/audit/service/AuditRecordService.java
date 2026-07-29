package com.gcul.audit.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.gcul.audit.model.AuditEventRecord;
import com.gcul.audit.repository.AuditEventRepository;

@Service
public class AuditRecordService {

	private final AuditEventRepository repository;
	private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

	public AuditRecordService(AuditEventRepository repository) {
		this.repository = repository;
	}

	@Transactional
	public AuditEventRecord record(String eventType, Map<String, Object> payload) {
		String resolvedType = AuditFlowCatalog.normalize(eventType);
		if (resolvedType.isBlank()) {
			resolvedType = AuditFlowCatalog.normalize(String.valueOf(payload.get("eventType")));
		}
		String sourceEventType = AuditFlowCatalog.firstNonBlank(
				payload, "sourceEventType", "source_event_type");
		if (sourceEventType.isBlank()) {
			sourceEventType = resolvedType;
		}
		String flow = AuditFlowCatalog.flowFor(sourceEventType);

		AuditEventRecord row = new AuditEventRecord();
		row.setEventId(AuditFlowCatalog.firstNonBlank(payload, "eventId", "event_id"));
		if (row.getEventId().isBlank()) {
			row.setEventId("evt-local-" + Instant.now().toEpochMilli());
		}
		row.setEventType(resolvedType);
		row.setSourceEventType(sourceEventType);
		row.setSourcePublisher(AuditFlowCatalog.firstNonBlank(payload, "sourcePublisher", "source_publisher"));
		row.setSourceTopic(AuditFlowCatalog.firstNonBlank(payload, "sourceTopic", "source_topic"));
		row.setFlowCategory(flow);
		row.setCustomerId(AuditFlowCatalog.firstNonBlank(payload, "customerId", "customer_id"));
		row.setPolicyId(AuditFlowCatalog.firstNonBlank(
				payload, "policyId", "policy_id", "policyRef", "policy_ref"));
		row.setClaimId(AuditFlowCatalog.firstNonBlank(payload, "claimId", "claim_id"));
		row.setQuoteId(AuditFlowCatalog.firstNonBlank(payload, "quoteId", "quote_id"));
		row.setOccurredAt(parseInstant(payload.get("timestamp")));
		row.setPayloadJson(writeJson(payload));
		return repository.save(row);
	}

	@Transactional(readOnly = true)
	public Map<String, Object> listEvents(String flow, String eventType, int limit) {
		int capped = Math.min(Math.max(limit, 1), 500);
		PageRequest page = PageRequest.of(0, capped);
		List<AuditEventRecord> rows;
		String normalizedFlow = AuditFlowCatalog.normalizeLower(flow);
		String normalizedType = AuditFlowCatalog.normalize(eventType);
		if (!normalizedFlow.isBlank()) {
			rows = repository.findByFlowCategoryOrderByOccurredAtDesc(normalizedFlow, page);
		}
		else if (!normalizedType.isBlank()) {
			rows = repository.findByEventTypeOrderByOccurredAtDesc(normalizedType, page);
		}
		else {
			rows = repository.findAllByOrderByOccurredAtDesc(page);
		}
		List<Map<String, Object>> items = rows.stream().map(this::toResponse).toList();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("events", items);
		result.put("count", items.size());
		result.put("flows", List.of("kyc", "wallet", "policy", "payment", "claims", "blockchain", "system"));
		return result;
	}

	private Map<String, Object> toResponse(AuditEventRecord row) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", row.getId());
		map.put("event_id", row.getEventId());
		map.put("event_type", row.getEventType());
		map.put("source_event_type", row.getSourceEventType());
		map.put("source_publisher", row.getSourcePublisher());
		map.put("source_topic", row.getSourceTopic());
		map.put("flow_category", row.getFlowCategory());
		map.put("customer_id", row.getCustomerId());
		map.put("policy_id", row.getPolicyId());
		map.put("claim_id", row.getClaimId());
		map.put("quote_id", row.getQuoteId());
		map.put("occurred_at", row.getOccurredAt() == null ? null : row.getOccurredAt().toString());
		map.put("payload", readJson(row.getPayloadJson()));
		return map;
	}

	private Instant parseInstant(Object raw) {
		if (raw == null) {
			return Instant.now();
		}
		try {
			return Instant.parse(String.valueOf(raw));
		}
		catch (Exception ex) {
			return Instant.now();
		}
	}

	private String writeJson(Map<String, Object> payload) {
		try {
			return mapper.writeValueAsString(payload);
		}
		catch (JsonProcessingException ex) {
			return "{}";
		}
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> readJson(String json) {
		if (json == null || json.isBlank()) {
			return Map.of();
		}
		try {
			return mapper.readValue(json, Map.class);
		}
		catch (Exception ex) {
			return Map.of("raw", json);
		}
	}
}
