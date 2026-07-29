package com.gcul.messaging.observability;

import java.util.Map;

/**
 * Bridge from {@link com.gcul.messaging.LocalEventBus} (non-Spring) to the observability HTTP client.
 */
public final class ObservabilityForwarder {

	private static volatile ObservabilityHttpClient client = null;

	private ObservabilityForwarder() {
	}

	public static void bind(ObservabilityHttpClient bound) {
		client = bound;
	}

	public static void forwardDomainEvent(Map<String, Object> payload) {
		ObservabilityHttpClient c = client;
		if (c != null) {
			c.ingestDomainEvent(payload);
		}
	}

	public static void forwardApiTrace(Map<String, Object> payload) {
		ObservabilityHttpClient c = client;
		if (c != null) {
			c.ingestApiTrace(payload);
		}
	}
}
