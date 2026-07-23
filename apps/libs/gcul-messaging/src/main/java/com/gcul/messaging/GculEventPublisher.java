package com.gcul.messaging;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.google.api.core.ApiFuture;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.TopicName;

public class GculEventPublisher implements AutoCloseable {

	private static final Logger log = LoggerFactory.getLogger(GculEventPublisher.class);

	private final boolean enabled;
	private final String projectId;
	private final String topicPrefix;
	private final String publisherServiceId;
	private final ObjectMapper mapper;

	public GculEventPublisher(
			boolean enabled,
			String projectId,
			String topicPrefix,
			String publisherServiceId) {
		this.enabled = enabled;
		this.projectId = projectId;
		this.topicPrefix = topicPrefix == null || topicPrefix.isBlank() ? "gcul" : topicPrefix;
		this.publisherServiceId = publisherServiceId;
		this.mapper = new ObjectMapper().registerModule(new JavaTimeModule());
	}

	public void publish(String topicSuffix, Map<String, Object> payload) {
		if (!enabled) {
			log.debug("Pub/Sub disabled; skip publish to {} eventType={}", topicSuffix, payload.get("eventType"));
			return;
		}
		if (projectId == null || projectId.isBlank()) {
			log.warn("Pub/Sub enabled but project-id missing; skip publish");
			return;
		}
		Map<String, Object> body = new LinkedHashMap<>(payload);
		body.putIfAbsent("eventId", "evt-" + UUID.randomUUID());
		body.putIfAbsent("timestamp", Instant.now().toString());
		if (!body.containsKey("eventType")) {
			throw new IllegalArgumentException("eventType required");
		}
		try {
			String topicId = PubSubNames.topicId(topicPrefix, topicSuffix);
			TopicName topic = TopicName.of(projectId, topicId);
			byte[] json = mapper.writeValueAsBytes(body);
			Publisher publisher = Publisher.newBuilder(topic).build();
			try {
				PubsubMessage message = PubsubMessage.newBuilder()
						.setData(ByteString.copyFrom(json))
						.putAttributes("eventType", String.valueOf(body.get("eventType")))
						.putAttributes("publisher", publisherServiceId)
						.build();
				ApiFuture<String> future = publisher.publish(message);
				String msgId = future.get();
				log.info("Published {} {} messageId={}", topicId, body.get("eventType"), msgId);
			}
			finally {
				publisher.shutdown();
			}
			publishAuditCopy(body);
		}
		catch (Exception ex) {
			log.error("Failed to publish to {}: {}", topicSuffix, ex.getMessage(), ex);
		}
	}

	private void publishAuditCopy(Map<String, Object> body) {
		if ("AuditRecord".equals(body.get("eventType"))) {
			return;
		}
		Map<String, Object> audit = new LinkedHashMap<>(body);
		audit.put("eventType", "AuditRecord");
		audit.put("sourceEventType", body.get("eventType"));
		audit.put("sourcePublisher", publisherServiceId);
		try {
			String topicId = PubSubNames.topicId(topicPrefix, EventTopics.AUDIT);
			TopicName topic = TopicName.of(projectId, topicId);
			byte[] json = mapper.writeValueAsBytes(audit);
			Publisher publisher = Publisher.newBuilder(topic).build();
			try {
				publisher.publish(PubsubMessage.newBuilder()
						.setData(ByteString.copyFrom(json))
						.build()).get();
			}
			finally {
				publisher.shutdown();
			}
		}
		catch (Exception ex) {
			log.debug("Audit fan-out skipped: {}", ex.getMessage());
		}
	}

	@Override
	public void close() {
		// per-publish publishers
	}
}
