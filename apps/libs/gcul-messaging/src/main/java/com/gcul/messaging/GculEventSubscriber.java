package com.gcul.messaging;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.google.cloud.pubsub.v1.AckReplyConsumer;
import com.google.cloud.pubsub.v1.MessageReceiver;
import com.google.cloud.pubsub.v1.Subscriber;
import com.google.pubsub.v1.ProjectSubscriptionName;

public class GculEventSubscriber implements AutoCloseable {

	private static final Logger log = LoggerFactory.getLogger(GculEventSubscriber.class);

	private final boolean enabled;
	private final String projectId;
	private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
	private Subscriber subscriber;

	public GculEventSubscriber(boolean enabled, String projectId) {
		this.enabled = enabled;
		this.projectId = projectId;
	}

	public void start(String subscriptionId, String consumerServiceId, List<DomainEventHandler> handlers) {
		if (!enabled) {
			log.info("Pub/Sub subscriber disabled; skip {}", subscriptionId);
			return;
		}
		if (projectId == null || projectId.isBlank()) {
			log.warn("Pub/Sub subscriber enabled but project-id missing");
			return;
		}
		ProjectSubscriptionName name = ProjectSubscriptionName.of(projectId, subscriptionId);
		MessageReceiver receiver = (message, consumer) -> {
			try {
				String json = message.getData().toString(StandardCharsets.UTF_8);
				Map<String, Object> payload = mapper.readValue(json, new TypeReference<>() {
				});
				String eventType = payload.get("eventType") == null
						? message.getAttributesOrDefault("eventType", "Unknown")
						: String.valueOf(payload.get("eventType"));
				log.info("[{}] received {} from sub {}", consumerServiceId, eventType, subscriptionId);
				boolean handled = false;
				for (DomainEventHandler handler : handlers) {
					if (handler.handle(eventType, payload)) {
						handled = true;
						break;
					}
				}
				if (!handled) {
					log.debug("No handler for eventType={}", eventType);
				}
				consumer.ack();
			}
			catch (Exception ex) {
				log.error("Subscriber error on {}: {}", subscriptionId, ex.getMessage(), ex);
				consumer.nack();
			}
		};
		subscriber = Subscriber.newBuilder(name, receiver).build();
		subscriber.startAsync().awaitRunning();
		log.info("Listening on subscription {} as {}", subscriptionId, consumerServiceId);
	}

	@Override
	public void close() throws Exception {
		if (subscriber != null) {
			subscriber.stopAsync().awaitTerminated(30, TimeUnit.SECONDS);
		}
	}
}
