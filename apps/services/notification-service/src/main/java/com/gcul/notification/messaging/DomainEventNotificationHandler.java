package com.gcul.notification.messaging;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DomainEventNotificationHandler {

	private static final Logger log = LoggerFactory.getLogger(DomainEventNotificationHandler.class);

	public boolean handle(String eventType, Map<String, Object> payload) {
		log.info("Notification dispatch (stub) for {} payloadKeys={}", eventType, payload.keySet());
		return true;
	}
}
