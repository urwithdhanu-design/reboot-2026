package com.gcul.parametric.messaging;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;

@Component
public class ParametricEventPublisher {

	private final GculEventPublisher publisher;

	public ParametricEventPublisher(GculEventPublisher publisher) {
		this.publisher = publisher;
	}

	public void claimInitiated(Map<String, Object> context) {
		Map<String, Object> payload = new LinkedHashMap<>(context);
		payload.put("eventType", "ClaimInitiated");
		publisher.publish(EventTopics.CLAIM, payload);
	}
}
