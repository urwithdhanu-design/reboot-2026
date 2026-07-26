package com.gcul.parametric.messaging;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ClaimInitiatedHandler {

	private static final Logger log = LoggerFactory.getLogger(ClaimInitiatedHandler.class);

	private final ClaimInitiatedProcessor processor;

	public ClaimInitiatedHandler(ClaimInitiatedProcessor processor) {
		this.processor = processor;
	}

	public boolean handle(String eventType, Map<String, Object> payload) {
		if ("ClaimInitiated".equals(eventType)) {
			if (Boolean.TRUE.equals(payload.get("processed"))) {
				log.debug("ClaimInitiated already processed for policy {}", payload.get("policyRef"));
				return true;
			}
			log.info("Processing ClaimInitiated for policy {}", payload.get("policyRef"));
			processor.processClaimInitiated(payload);
			return true;
		}
		if ("ClaimRequested".equals(eventType) || "ClaimApproved".equals(eventType)) {
			log.debug("Parametric fraud stub for {} claimId={}", eventType, payload.get("claimId"));
			return true;
		}
		return false;
	}
}
