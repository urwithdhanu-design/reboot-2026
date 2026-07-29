package com.gcul.messaging.audit;

import java.util.Map;

/**
 * Bridge from {@link com.gcul.messaging.LocalEventBus} to the audit-service HTTP ingest API.
 */
public final class AuditForwarder {

	private static volatile AuditHttpClient client = null;

	private AuditForwarder() {
	}

	public static void bind(AuditHttpClient bound) {
		client = bound;
	}

	public static void forwardDomainEvent(Map<String, Object> payload) {
		AuditHttpClient c = client;
		if (c != null) {
			c.ingestDomainEvent(payload);
		}
	}
}
