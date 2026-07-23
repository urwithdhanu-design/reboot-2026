package com.gcul.parametric.messaging;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ClaimFraudScreeningHandler {

	private static final Logger log = LoggerFactory.getLogger(ClaimFraudScreeningHandler.class);

	public boolean handle(String eventType, Map<String, Object> payload) {
		if (!"ClaimRequested".equals(eventType) && !"ClaimApproved".equals(eventType)) {
			return false;
		}
		log.info("Parametric rules (stub) for {} claimId={}", eventType, payload.get("claimId"));
		return true;
	}
}
