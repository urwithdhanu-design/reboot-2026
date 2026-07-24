package com.gcul.payment.cache;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;

@Service
public class AdminViewCache {

	private static final Logger log = LoggerFactory.getLogger(AdminViewCache.class);

	public static final String DOC_PAYMENTS = "admin_payments";

	private final FirestoreCacheProperties props;
	private final Optional<Firestore> firestore;
	private final ObjectMapper objectMapper;

	public AdminViewCache(
			FirestoreCacheProperties props,
			@Autowired(required = false) Firestore firestore,
			ObjectMapper objectMapper) {
		this.props = props;
		this.firestore = Optional.ofNullable(firestore);
		this.objectMapper = objectMapper;
	}

	public boolean isActive() {
		return props.isEnabled() && firestore.isPresent();
	}

	public void store(String documentId, Object payload) {
		if (!isActive()) {
			return;
		}
		try {
			String json = objectMapper.writeValueAsString(payload);
			Map<String, Object> data = new LinkedHashMap<>();
			data.put("payloadJson", json);
			data.put("cachedAtEpochSeconds", Instant.now().getEpochSecond());
			data.put("source", "gcul-payment");
			docRef(documentId).set(data).get();
			log.info("Wrote admin cache {}/{}", props.getCollection(), documentId);
		}
		catch (Exception ex) {
			log.warn("Admin Firestore cache write failed ({}): {}", documentId, ex.getMessage());
		}
	}

	private DocumentReference docRef(String documentId) {
		return firestore.get().collection(props.getCollection()).document(documentId);
	}
}
