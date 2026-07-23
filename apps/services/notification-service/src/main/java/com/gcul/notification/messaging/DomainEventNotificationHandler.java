package com.gcul.notification.messaging;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.gcul.messaging.spring.GculPubSubProperties;

@Component
public class DomainEventNotificationHandler {

	private static final Logger log = LoggerFactory.getLogger(DomainEventNotificationHandler.class);

	private final PubSubEventEmailService eventEmail;
	private final GculPubSubProperties pubSub;

	public DomainEventNotificationHandler(PubSubEventEmailService eventEmail, GculPubSubProperties pubSub) {
		this.eventEmail = eventEmail;
		this.pubSub = pubSub;
	}

	public boolean handle(String topicSuffix, String eventType, Map<String, Object> payload) {
		if ("AuditRecord".equals(eventType)) {
			log.debug("Skip ops DL email for audit fan-out copy of {}", payload.get("sourceEventType"));
			return true;
		}
		log.info("Pub/Sub event {} on topic {} (consumer {})", eventType, topicSuffix, pubSub.getServiceId());
		eventEmail.notifyOps(topicSuffix, pubSub.getServiceId(), eventType, payload);
		return true;
	}
}
