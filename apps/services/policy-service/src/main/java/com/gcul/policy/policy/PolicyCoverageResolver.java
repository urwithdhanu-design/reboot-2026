package com.gcul.policy.policy;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.gcul.policy.travel.TravelCoverageLimits;
import com.gcul.policy.motor.MotorCoverageLimits;

@Component
public class PolicyCoverageResolver {

	private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.UK);

	private final ObjectMapper objectMapper;

	public PolicyCoverageResolver(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	/** Limits and summary stored at issuance — cover dates activate on mint. */
	public PolicyCoverageSnapshot resolvePendingFromQuote(Map<String, Object> quote) {
		return resolveWithStart(quote, null);
	}

	/** @deprecated use {@link #resolvePendingFromQuote} */
	public PolicyCoverageSnapshot resolveFromQuote(Map<String, Object> quote) {
		return resolvePendingFromQuote(quote);
	}

	/** Activate cover from mint/approval instant — customer can claim from this moment. */
	public PolicyCoverageSnapshot activateOnMint(Map<String, Object> quote, Instant mintedAt) {
		Instant start = mintedAt == null ? Instant.now() : mintedAt;
		return resolveWithStart(quote, start);
	}

	private PolicyCoverageSnapshot resolveWithStart(Map<String, Object> quote, Instant coverageStart) {
		String category = normalizeProductCategory(str(quote.get("category")), str(quote.get("product_title")));
		@SuppressWarnings("unchecked")
		Map<String, Object> answers = quote.get("answers") instanceof Map<?, ?> map
				? (Map<String, Object>) map
				: Map.of();

		return switch (normalizeCategory(category)) {
			case "Life" -> resolveLife(answers, coverageStart);
			case "Travel" -> resolveTravel(answers, coverageStart);
			case "Health" -> resolveHealth(answers, coverageStart);
			case "Property" -> resolveProperty(answers, coverageStart);
			case "Vehicle" -> resolveVehicle(answers, coverageStart);
			case "Pet" -> resolvePet(answers, coverageStart);
			default -> resolveDefault(category, answers, coverageStart);
		};
	}

	public PolicyCoverageSnapshot activateFallback(String category, String productTitle, Instant mintedAt) {
		return resolveFallback(category, productTitle, mintedAt);
	}

	public PolicyCoverageSnapshot resolveFallback(String category, Instant referenceAt) {
		return resolveFallback(category, null, referenceAt);
	}

	public PolicyCoverageSnapshot resolveFallback(String category, String productTitle, Instant referenceAt) {
		String normalized = normalizeProductCategory(category, productTitle);
		boolean pending = referenceAt == null;
		Instant start = pending ? null : referenceAt;
		Instant expires = pending ? null : referenceAt.plus(365, ChronoUnit.DAYS);
		String summary = pending
				? normalized + " · £25,000 limit · activates when minted"
				: normalized + " · £25,000 limit · from " + formatInstant(referenceAt);
		return new PolicyCoverageSnapshot(
				normalized,
				start,
				expires,
				25_000.0,
				summary,
				List.of(Map.of("code", "general", "label", "General cover", "limit_gbp", 25_000.0)));
	}

	/** Maps product titles (e.g. Travel Protect Plus) to standard cover categories (Travel). */
	public static String normalizeProductCategory(String category, String productTitle) {
		String raw = firstNonBlank(category, productTitle, "General");
		String key = raw.trim().toLowerCase(Locale.ROOT);
		if (key.equals("home")) {
			return "Property";
		}
		if (key.equals("life") || key.equals("travel") || key.equals("health")
				|| key.equals("property") || key.equals("vehicle") || key.equals("pet")) {
			return key.substring(0, 1).toUpperCase(Locale.ROOT) + key.substring(1);
		}
		if (key.contains("travel") || key.contains("flight") || key.contains("trip") || key.contains("protect plus")) {
			return "Travel";
		}
		if (key.contains("home") || key.contains("property") || key.contains("buildings")
				|| key.contains("contents")) {
			return "Property";
		}
		if (key.contains("motor") || key.contains("vehicle") || key.contains("car insurance")) {
			return "Vehicle";
		}
		if (key.contains("health") || key.contains("vitality")) {
			return "Health";
		}
		if (key.contains("pet")) {
			return "Pet";
		}
		if (key.contains("life")) {
			return "Life";
		}
		return raw.trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value.trim();
			}
		}
		return "";
	}

	private PolicyCoverageSnapshot resolveLife(Map<String, Object> answers, Instant coverageStart) {
		double limit = doubleVal(answers.get("cover_amount"), 100_000);
		int termYears = intVal(answers.get("term_years"), 20);
		boolean pending = coverageStart == null;
		Instant expires = pending ? null : coverageStart.plus(termYears * 365L, ChronoUnit.DAYS);
		String smoker = str(answers.get("smoker"));
		String summary = pending
				? String.format(Locale.ROOT, "Life cover £%,.0f · %d year term · activates when minted%s",
						limit, termYears, smoker.isBlank() ? "" : (" · " + smoker))
				: String.format(Locale.ROOT, "Life cover £%,.0f · %d year term · from %s%s",
						limit, termYears, formatInstant(coverageStart), smoker.isBlank() ? "" : (" · " + smoker));
		return new PolicyCoverageSnapshot("Life", coverageStart, expires, limit, summary,
				List.of(Map.of("code", "life_death", "label", "Death benefit", "limit_gbp", limit)));
	}

	private PolicyCoverageSnapshot resolveTravel(Map<String, Object> answers, Instant coverageStart) {
		boolean pending = coverageStart == null;
		String tripType = str(answers.get("trip_type")).toLowerCase(Locale.ROOT);
		boolean roundTrip = tripType.contains("round");
		String returnDate = str(answers.get("return_date"));

		Instant expires = null;
		if (!pending) {
			Instant tripEnd = !roundTrip || returnDate.isBlank()
					? coverageStart.plus(90, ChronoUnit.DAYS)
					: parseDateEnd(returnDate);
			expires = tripEnd.isBefore(coverageStart) ? coverageStart.plus(90, ChronoUnit.DAYS) : tripEnd;
		}

		List<Map<String, Object>> items = new ArrayList<>();
		if (isYes(answers.get("coverage_flight_delay"))) {
			items.add(Map.of("code", "flight_delay", "label", "Flight delay", "limit_gbp",
					TravelCoverageLimits.FLIGHT_DELAY_ITEM_LIMIT_GBP));
		}
		if (isYes(answers.get("coverage_cancellation"))) {
			items.add(Map.of("code", "trip_cancellation", "label", "Trip cancellation", "limit_gbp",
					TravelCoverageLimits.TRIP_CANCELLATION_ITEM_LIMIT_GBP));
		}
		double totalLimit;
		if (items.isEmpty()) {
			items.add(Map.of("code", "travel_medical", "label", "Emergency medical", "limit_gbp", 1_000_000.0));
			totalLimit = 1_000_000;
		}
		else {
			totalLimit = TravelCoverageLimits.POLICY_LIMIT_GBP;
		}

		String destination = str(answers.get("destination"));
		String summary = pending
				? String.format(Locale.ROOT, "Travel · %s · %s · £%,.0f limit · activates when minted",
						destination.isBlank() ? "trip" : destination,
						roundTrip ? "round trip" : "single trip",
						totalLimit)
				: String.format(Locale.ROOT, "Travel · %s · %s · £%,.0f limit · from %s",
						destination.isBlank() ? "trip" : destination,
						roundTrip ? "round trip" : "single trip",
						totalLimit,
						formatInstant(coverageStart));
		return new PolicyCoverageSnapshot("Travel", coverageStart, expires, totalLimit, summary, items);
	}

	private PolicyCoverageSnapshot resolveHealth(Map<String, Object> answers, Instant coverageStart) {
		boolean pending = coverageStart == null;
		Instant expires = pending ? null : coverageStart.plus(365, ChronoUnit.DAYS);
		double limit = 50_000;
		String who = str(answers.get("cover_who"));
		String summary = pending
				? "Health · " + (who.isBlank() ? "individual" : who) + " · £50,000 limit · activates when minted"
				: "Health · " + (who.isBlank() ? "individual" : who) + " · £50,000 limit · from "
						+ formatInstant(coverageStart);
		return new PolicyCoverageSnapshot("Health", coverageStart, expires, limit, summary,
				List.of(Map.of("code", "health_treatment", "label", "Treatment & diagnostics", "limit_gbp", limit)));
	}

	private PolicyCoverageSnapshot resolveProperty(Map<String, Object> answers, Instant coverageStart) {
		boolean pending = coverageStart == null;
		Instant expires = pending ? null : coverageStart.plus(365, ChronoUnit.DAYS);
		String coverType = str(answers.get("cover_type"));
		double limit = switch (coverType.toLowerCase(Locale.ROOT)) {
			case "just contents" -> 75_000;
			case "just buildings" -> 300_000;
			default -> 350_000;
		};
		String typeLabel = coverType.isBlank() ? "Buildings and Contents" : coverType;
		String summary = pending
				? "Home · " + typeLabel + String.format(Locale.ROOT, " · £%,.0f limit · activates when minted", limit)
				: "Home · " + typeLabel + String.format(Locale.ROOT, " · £%,.0f limit · from %s", limit,
						formatInstant(coverageStart));
		return new PolicyCoverageSnapshot("Property", coverageStart, expires, limit, summary,
				List.of(Map.of("code", "property_damage", "label", typeLabel, "limit_gbp", limit)));
	}

	private PolicyCoverageSnapshot resolveVehicle(Map<String, Object> answers, Instant coverageStart) {
		boolean pending = coverageStart == null;
		Instant expires = pending ? null : coverageStart.plus(365, ChronoUnit.DAYS);
		String coverType = str(answers.get("cover_type"));
		double limit = switch (coverType.toLowerCase(Locale.ROOT)) {
			case "third party only" -> 5_000;
			case "third party fire & theft" -> 8_000;
			default -> 15_000;
		};
		String vehicle = str(answers.get("vehicle_type"));
		String typeLabel = coverType.isBlank() ? "Comprehensive" : coverType;

		List<Map<String, Object>> items = new ArrayList<>();
		if (isYes(answers.get("coverage_accident_detection"))) {
			items.add(Map.of("code", "telematics_accident", "label", "Telematics accident detection", "limit_gbp",
					MotorCoverageLimits.ACCIDENT_ITEM_LIMIT_GBP));
			limit = MotorCoverageLimits.POLICY_LIMIT_GBP;
		}
		else {
			items.add(Map.of("code", "vehicle_damage", "label", typeLabel, "limit_gbp", limit));
		}

		String reg = str(answers.get("vehicle_reg"));
		String summary = pending
				? "Motor · " + (vehicle.isBlank() ? "vehicle" : vehicle)
						+ (reg.isBlank() ? "" : " · " + reg)
						+ " · " + typeLabel
						+ String.format(Locale.ROOT, " · £%,.0f limit · activates when minted", limit)
				: "Motor · " + (vehicle.isBlank() ? "vehicle" : vehicle)
						+ (reg.isBlank() ? "" : " · " + reg)
						+ " · " + typeLabel
						+ String.format(Locale.ROOT, " · £%,.0f limit · from %s", limit, formatInstant(coverageStart));
		return new PolicyCoverageSnapshot("Vehicle", coverageStart, expires, limit, summary, items);
	}

	private PolicyCoverageSnapshot resolvePet(Map<String, Object> answers, Instant coverageStart) {
		boolean pending = coverageStart == null;
		Instant expires = pending ? null : coverageStart.plus(365, ChronoUnit.DAYS);
		String level = str(answers.get("cover_level"));
		double limit = switch (level.toLowerCase(Locale.ROOT)) {
			case "accident only" -> 3_000;
			case "lifetime" -> 15_000;
			default -> 8_000;
		};
		String pet = str(answers.get("pet_type"));
		String levelLabel = level.isBlank() ? "Accident & illness" : level;
		String summary = pending
				? "Pet · " + (pet.isBlank() ? "cover" : pet) + " · " + levelLabel
						+ String.format(Locale.ROOT, " · £%,.0f limit · activates when minted", limit)
				: "Pet · " + (pet.isBlank() ? "cover" : pet) + " · " + levelLabel
						+ String.format(Locale.ROOT, " · £%,.0f limit · from %s", limit, formatInstant(coverageStart));
		return new PolicyCoverageSnapshot("Pet", coverageStart, expires, limit, summary,
				List.of(Map.of("code", "pet_vet", "label", levelLabel, "limit_gbp", limit)));
	}

	private PolicyCoverageSnapshot resolveDefault(String category, Map<String, Object> answers, Instant coverageStart) {
		boolean pending = coverageStart == null;
		Instant expires = pending ? null : coverageStart.plus(365, ChronoUnit.DAYS);
		double limit = 25_000;
		String summary = pending
				? category + " · £25,000 limit · activates when minted"
				: category + " · £25,000 limit · from " + formatInstant(coverageStart);
		return new PolicyCoverageSnapshot(category, coverageStart, expires, limit, summary,
				List.of(Map.of("code", "general", "label", "General cover", "limit_gbp", limit)));
	}

	public List<Map<String, Object>> parseCoverageItems(String json) {
		if (json == null || json.isBlank()) {
			return List.of();
		}
		try {
			return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {
			});
		}
		catch (Exception ex) {
			return List.of();
		}
	}

	public String serializeCoverageItems(List<Map<String, Object>> items) {
		try {
			return objectMapper.writeValueAsString(items == null ? List.of() : items);
		}
		catch (Exception ex) {
			return "[]";
		}
	}

	private static String formatInstant(Instant instant) {
		return DATE_FMT.format(instant.atZone(ZoneOffset.UTC));
	}

	private static String normalizeCategory(String category) {
		String key = category.trim();
		if (key.equalsIgnoreCase("home")) {
			return "Property";
		}
		return key.substring(0, 1).toUpperCase(Locale.ROOT) + key.substring(1).toLowerCase(Locale.ROOT);
	}

	private static Instant parseDateEnd(Object value) {
		LocalDate date = parseLocalDate(value);
		return date == null
				? Instant.now().plus(90, ChronoUnit.DAYS)
				: date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minus(1, ChronoUnit.SECONDS);
	}

	private static LocalDate parseLocalDate(Object value) {
		String raw = str(value);
		if (raw.isBlank()) {
			return null;
		}
		try {
			return LocalDate.parse(raw);
		}
		catch (Exception ex) {
			return null;
		}
	}

	private static boolean isYes(Object value) {
		return "yes".equalsIgnoreCase(str(value));
	}

	private static double doubleVal(Object value, double fallback) {
		if (value instanceof Number number) {
			return number.doubleValue();
		}
		try {
			return Double.parseDouble(str(value));
		}
		catch (Exception ex) {
			return fallback;
		}
	}

	private static int intVal(Object value, int fallback) {
		if (value instanceof Number number) {
			return number.intValue();
		}
		try {
			return Integer.parseInt(str(value));
		}
		catch (Exception ex) {
			return fallback;
		}
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
