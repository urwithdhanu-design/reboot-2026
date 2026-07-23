package com.gcul.kyc.messaging;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;
import com.gcul.kyc.model.UserAccount;

@Component
public class CustomerEventPublisher {

	private final GculEventPublisher publisher;

	public CustomerEventPublisher(GculEventPublisher publisher) {
		this.publisher = publisher;
	}

	public void customerRegistered(UserAccount user) {
		String[] names = splitName(user.getFullName());
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("eventType", "CustomerRegistered");
		payload.put("customerId", user.getId());
		payload.put("firstName", names[0]);
		payload.put("lastName", names[1]);
		payload.put("email", user.getEmail());
		payload.put("mobile", user.getMobileNumber());
		payload.put("status", "REGISTERED");
		publisher.publish(EventTopics.CUSTOMER, payload);
	}

	public void customerVerified(UserAccount user) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("eventType", "CustomerVerified");
		payload.put("customerId", user.getId());
		payload.put("kycStatus", "VERIFIED");
		publisher.publish(EventTopics.CUSTOMER, payload);
	}

	private static String[] splitName(String fullName) {
		if (fullName == null || fullName.isBlank()) {
			return new String[] { "", "" };
		}
		String trimmed = fullName.trim();
		int space = trimmed.indexOf(' ');
		if (space < 0) {
			return new String[] { trimmed, "" };
		}
		return new String[] { trimmed.substring(0, space), trimmed.substring(space + 1).trim() };
	}
}
