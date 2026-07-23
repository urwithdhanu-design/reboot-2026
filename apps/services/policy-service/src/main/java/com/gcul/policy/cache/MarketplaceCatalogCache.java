package com.gcul.policy.cache;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gcul.policy.model.InsurancePlan;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

@Service
public class MarketplaceCatalogCache {

	private static final Logger log = LoggerFactory.getLogger(MarketplaceCatalogCache.class);
	private static final TypeReference<List<InsurancePlan>> PLAN_LIST = new TypeReference<>() {
	};

	private final FirestoreCacheProperties props;
	private final Optional<Firestore> firestore;
	private final ObjectMapper objectMapper;

	public MarketplaceCatalogCache(
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

	public Optional<List<InsurancePlan>> loadPlansIfFresh() {
		if (!isActive()) {
			return Optional.empty();
		}
		try {
			DocumentSnapshot snap = docRef().get().get();
			if (!snap.exists()) {
				return Optional.empty();
			}
			Long cachedAt = snap.getLong("cachedAtEpochSeconds");
			if (cachedAt == null || isExpired(cachedAt)) {
				return Optional.empty();
			}
			String json = snap.getString("plansJson");
			if (json == null || json.isBlank()) {
				return Optional.empty();
			}
			List<InsurancePlan> plans = objectMapper.readValue(json, PLAN_LIST);
			log.debug("Firestore cache hit: {} plans", plans.size());
			return Optional.of(plans);
		}
		catch (Exception ex) {
			log.warn("Firestore catalog read failed: {}", ex.getMessage());
			return Optional.empty();
		}
	}

	public void storePlans(List<InsurancePlan> plans) {
		if (!isActive()) {
			return;
		}
		try {
			String json = objectMapper.writeValueAsString(plans);
			Map<String, Object> data = Map.of(
					"plansJson", json,
					"cachedAtEpochSeconds", Instant.now().getEpochSecond(),
					"planCount", plans.size(),
					"source", "gcul-policy");
			docRef().set(data).get();
			log.info("Wrote {} plans to Firestore cache ({}/{})",
					plans.size(), props.getCollection(), props.getMarketplaceDocument());
		}
		catch (Exception ex) {
			log.warn("Firestore catalog write failed: {}", ex.getMessage());
		}
	}

	private boolean isExpired(long cachedAtEpochSeconds) {
		long age = Instant.now().getEpochSecond() - cachedAtEpochSeconds;
		return age > props.getMarketplaceTtlSeconds();
	}

	private DocumentReference docRef() {
		return firestore.get()
				.collection(props.getCollection())
				.document(props.getMarketplaceDocument());
	}
}
