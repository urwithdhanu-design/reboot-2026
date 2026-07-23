package com.gcul.wallet.messaging;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class CustomerVerifiedHandler {

	private static final Logger log = LoggerFactory.getLogger(CustomerVerifiedHandler.class);

	public boolean handle(String eventType, Map<String, Object> payload) {
		if (!"CustomerVerified".equals(eventType)) {
			return false;
		}
		log.info("Customer {} KYC verified — wallet creation allowed", payload.get("customerId"));
		return true;
	}
}
