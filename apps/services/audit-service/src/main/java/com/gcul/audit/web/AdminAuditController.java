package com.gcul.audit.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.audit.service.AuditRecordService;

@RestController
@RequestMapping("/api/admin/audit")
public class AdminAuditController {

	private final AuditRecordService auditRecords;

	public AdminAuditController(AuditRecordService auditRecords) {
		this.auditRecords = auditRecords;
	}

	@GetMapping("/events")
	public Map<String, Object> listEvents(
			@RequestParam(required = false) String flow,
			@RequestParam(required = false) String event_type,
			@RequestParam(defaultValue = "100") int limit) {
		return auditRecords.listEvents(flow, event_type, limit);
	}
}
