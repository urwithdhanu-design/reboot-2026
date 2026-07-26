package com.gcul.messaging;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * In-process event dispatcher used when Google Cloud Pub/Sub is disabled (local dev).
 */
public final class LocalEventBus {

	private static final Logger log = LoggerFactory.getLogger(LocalEventBus.class);

	private static final Map<String, List<DomainEventHandler>> HANDLERS = new ConcurrentHashMap<>();

	private LocalEventBus() {
	}

	public static void register(String topicSuffix, DomainEventHandler handler) {
		HANDLERS.computeIfAbsent(topicSuffix, ignored -> new CopyOnWriteArrayList<>()).add(handler);
		log.info("Registered local handler for topic {}", topicSuffix);
	}

	public static void dispatch(String topicSuffix, Map<String, Object> payload, String publisherServiceId) {
		Map<String, Object> body = new LinkedHashMap<>(payload);
		body.putIfAbsent("eventId", "evt-" + UUID.randomUUID());
		body.putIfAbsent("timestamp", Instant.now().toString());
		if (!body.containsKey("eventType")) {
			throw new IllegalArgumentException("eventType required");
		}
		String eventType = String.valueOf(body.get("eventType"));
		List<DomainEventHandler> handlers = HANDLERS.get(topicSuffix);
		if (handlers == null || handlers.isEmpty()) {
			log.debug("No local handlers for topic {} eventType={}", topicSuffix, eventType);
			return;
		}
		log.info("[local:{}] dispatch {} on {}", publisherServiceId, eventType, topicSuffix);
		for (DomainEventHandler handler : handlers) {
			try {
				if (handler.handle(eventType, body)) {
					break;
				}
			}
			catch (Exception ex) {
				log.error("Local handler failed for {} on {}: {}", eventType, topicSuffix, ex.getMessage(), ex);
			}
		}
	}

	public static void clear() {
		HANDLERS.clear();
	}
}
