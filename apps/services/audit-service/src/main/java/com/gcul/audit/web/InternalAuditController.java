package com.gcul.audit.web;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.audit.model.AuditEventRecord;
import com.gcul.audit.service.AuditRecordService;

@RestController
@RequestMapping("/api/internal/audit")
public class InternalAuditController {

	private final AuditRecordService auditRecords;

	public InternalAuditController(AuditRecordService auditRecords) {
		this.auditRecords = auditRecords;
	}

	@PostMapping("/events")
	public Map<String, Object> ingest(@RequestBody Map<String, Object> payload) {
		AuditEventRecord saved = auditRecords.record(
				String.valueOf(payload.getOrDefault("eventType", "AuditRecord")),
				payload);
		return Map.of(
				"ok", true,
				"id", saved.getId(),
				"event_id", saved.getEventId(),
				"flow_category", saved.getFlowCategory());
	}
}
