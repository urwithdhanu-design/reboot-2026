package com.gcul.claims.messaging;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.gcul.claims.model.InsuranceClaim;
import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;

@Component
public class ClaimEventPublisher {

	private final GculEventPublisher publisher;

	public ClaimEventPublisher(GculEventPublisher publisher) {
		this.publisher = publisher;
	}

	public void claimRequested(InsuranceClaim claim) {
		Map<String, Object> payload = base(claim);
		payload.put("eventType", "ClaimRequested");
		publisher.publish(EventTopics.CLAIM, payload);
	}

	public void claimApproved(InsuranceClaim claim) {
		Map<String, Object> payload = base(claim);
		payload.put("eventType", "ClaimApproved");
		publisher.publish(EventTopics.CLAIM, payload);
	}

	private static Map<String, Object> base(InsuranceClaim claim) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("claimId", claim.getId());
		payload.put("policyRef", claim.getPolicyRef());
		payload.put("customerName", claim.getCustomerName());
		payload.put("amountClaimed", claim.getAmountClaimed());
		payload.put("status", claim.getStatus());
		return payload;
	}
}
