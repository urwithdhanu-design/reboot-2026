package com.gcul.audit.messaging;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AuditEventHandler {

	private static final Logger auditLog = LoggerFactory.getLogger("gcul.audit");

	public boolean handle(String eventType, Map<String, Object> payload) {
		auditLog.info("AUDIT {} eventId={} sourceEventType={} payload={}",
				eventType,
				payload.get("eventId"),
				payload.get("sourceEventType"),
				payload);
		return true;
	}
}
