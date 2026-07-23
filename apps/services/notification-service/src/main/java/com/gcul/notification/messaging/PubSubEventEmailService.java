package com.gcul.notification.messaging;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gcul.messaging.PubSubNames;
import com.gcul.messaging.spring.GculPubSubProperties;
import com.gcul.notification.mail.OpsDlMailService;

@Service
public class PubSubEventEmailService {

	private final OpsDlMailService mail;
	private final GculPubSubProperties pubSub;
	private final ObjectMapper mapper = new ObjectMapper();

	public PubSubEventEmailService(OpsDlMailService mail, GculPubSubProperties pubSub) {
		this.mail = mail;
		this.pubSub = pubSub;
	}

	public void notifyOps(String topicSuffix, String consumerServiceId, String eventType, Map<String, Object> payload) {
		String topicId = PubSubNames.topicId(pubSub.getTopicPrefix(), topicSuffix);
		String subscriptionId = PubSubNames.subscriptionId(pubSub.getTopicPrefix(), topicSuffix, consumerServiceId);
		String eventId = payload.get("eventId") == null ? "—" : String.valueOf(payload.get("eventId"));
		String timestamp = payload.get("timestamp") == null ? "—" : String.valueOf(payload.get("timestamp"));
		String payloadJson;
		try {
			payloadJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload);
		}
		catch (Exception ex) {
			payloadJson = String.valueOf(payload);
		}

		String subject = "GCUL Pub/Sub · " + eventType + " · " + topicId;
		String body = """
				<h2>Pub/Sub event consumed</h2>
				<table cellpadding="6" style="border-collapse:collapse;font-family:Segoe UI,sans-serif;font-size:14px;">
				<tr><td><strong>Event type</strong></td><td>%s</td></tr>
				<tr><td><strong>Topic</strong></td><td><code>%s</code></td></tr>
				<tr><td><strong>Subscription</strong></td><td><code>%s</code></td></tr>
				<tr><td><strong>Consumer</strong></td><td>%s</td></tr>
				<tr><td><strong>Event ID</strong></td><td>%s</td></tr>
				<tr><td><strong>Timestamp</strong></td><td>%s</td></tr>
				</table>
				<h3>Payload</h3>
				<pre style="background:#f4f4f4;padding:12px;border-radius:8px;overflow:auto;">%s</pre>
				""".formatted(
				escape(eventType),
				escape(topicId),
				escape(subscriptionId),
				escape(consumerServiceId),
				escape(eventId),
				escape(timestamp),
				escape(payloadJson));

		mail.sendToDl(subject, body);
	}

	private static String escape(String value) {
		if (value == null) {
			return "";
		}
		return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
	}
}
