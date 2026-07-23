package com.gcul.messaging;

import java.util.Map;

@FunctionalInterface
public interface DomainEventHandler {

	/** @return true if this handler processed the message */
	boolean handle(String eventType, Map<String, Object> payload);
}
