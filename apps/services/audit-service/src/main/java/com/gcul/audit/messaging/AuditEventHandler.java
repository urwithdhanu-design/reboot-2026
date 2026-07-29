package com.gcul.audit.messaging;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.gcul.audit.service.AuditRecordService;

@Component
public class AuditEventHandler {

	private static final Logger auditLog = LoggerFactory.getLogger("gcul.audit");

	private final AuditRecordService auditRecords;

	public AuditEventHandler(AuditRecordService auditRecords) {
		this.auditRecords = auditRecords;
	}

	public boolean handle(String eventType, Map<String, Object> payload) {
		var saved = auditRecords.record(eventType, payload);
		auditLog.info("AUDIT {} eventId={} flow={} sourceEventType={}",
				eventType,
				saved.getEventId(),
				saved.getFlowCategory(),
				saved.getSourceEventType());
		return true;
	}
}
