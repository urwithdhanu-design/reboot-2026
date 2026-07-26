package com.gcul.parametric.oracle;

import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.gcul.parametric.config.FlightOracleProperties;

/**
 * AeroDataBox via RapidAPI — alternative live flight status provider.
 * Set {@code gcul.flight-oracle.provider=aerodatabox} and {@code RAPIDAPI_KEY}.
 */
@Component
public class AeroDataBoxFlightOracle implements FlightDelayOracle {

	private static final Logger log = LoggerFactory.getLogger(AeroDataBoxFlightOracle.class);

	private final FlightOracleProperties properties;
	private final RestClient restClient;

	public AeroDataBoxFlightOracle(FlightOracleProperties properties) {
		this.properties = properties;
		this.restClient = RestClient.builder().baseUrl(properties.getAeroDataBoxBaseUrl()).build();
	}

	@Override
	public String providerId() {
		return "aerodatabox";
	}

	@Override
	@SuppressWarnings("unchecked")
	public FlightDelaySnapshot lookup(String flightNumber, String travelDate) {
		if (!properties.isConfigured()) {
			return FlightDelaySnapshot.error(
					flightNumber,
					travelDate,
					providerId(),
					"RAPIDAPI_KEY is not configured for AeroDataBox");
		}

		String normalizedFlight = AviationStackFlightOracle.normalizeFlightNumber(flightNumber);
		String number = stripAirlinePrefix(normalizedFlight);
		String airline = airlinePrefix(normalizedFlight);

		try {
			Map<String, Object> response = restClient.get()
					.uri("/flights/number/{airline}/{number}/{date}", airline, number, travelDate)
					.header("X-RapidAPI-Key", properties.getApiKey())
					.header("X-RapidAPI-Host", properties.getAeroDataBoxHost())
					.retrieve()
					.body(Map.class);

			if (response == null) {
				return FlightDelaySnapshot.notFound(normalizedFlight, travelDate, providerId(), "Empty AeroDataBox response");
			}

			Object flightsObj = response.get("flights");
			if (!(flightsObj instanceof List<?> flights) || flights.isEmpty()) {
				return FlightDelaySnapshot.notFound(
						normalizedFlight,
						travelDate,
						providerId(),
						"No flight data for " + normalizedFlight + " on " + travelDate);
			}

			Map<String, Object> flight = (Map<String, Object>) flights.get(0);
			Map<String, Object> departure = map(flight.get("departure"));
			Map<String, Object> arrival = map(flight.get("arrival"));
			String status = str(flight.get("status"));

			String scheduled = str(departure.get("scheduledTimeLocal"));
			if (scheduled.isBlank()) {
				scheduled = str(departure.get("scheduledTimeUtc"));
			}
			String actual = firstNonBlank(
					str(departure.get("actualTimeLocal")),
					str(departure.get("actualTimeUtc")),
					str(departure.get("revisedTimeLocal")),
					str(departure.get("revisedTimeUtc")));

			int delayMinutes = computeDelay(scheduled, actual);

			return new FlightDelaySnapshot(
					normalizedFlight,
					travelDate,
					delayMinutes,
					status.isBlank() ? "unknown" : status,
					scheduled,
					actual,
					str(arrival.get("airport")),
					str(departure.get("airport")),
					providerId(),
					true,
					"Live delay from AeroDataBox",
					Instant.now());
		}
		catch (Exception ex) {
			log.warn("AeroDataBox lookup failed for {} on {}: {}", normalizedFlight, travelDate, ex.getMessage());
			return FlightDelaySnapshot.error(normalizedFlight, travelDate, providerId(), ex.getMessage());
		}
	}

	private static int computeDelay(String scheduled, String actual) {
		if (scheduled.isBlank() || actual.isBlank()) {
			return 0;
		}
		try {
			Instant sched = parseInstant(scheduled);
			Instant act = parseInstant(actual);
			return (int) Math.max(0, Duration.between(sched, act).toMinutes());
		}
		catch (Exception ex) {
			return 0;
		}
	}

	private static Instant parseInstant(String value) {
		try {
			return OffsetDateTime.parse(value).toInstant();
		}
		catch (DateTimeParseException ex) {
			return Instant.parse(value);
		}
	}

	private static String airlinePrefix(String flight) {
		if (flight.length() >= 3) {
			return flight.substring(0, 2);
		}
		return flight;
	}

	private static String stripAirlinePrefix(String flight) {
		if (flight.length() > 2) {
			return flight.substring(2);
		}
		return flight;
	}

	@SuppressWarnings("unchecked")
	private static Map<String, Object> map(Object value) {
		if (value instanceof Map<?, ?> map) {
			return (Map<String, Object>) map;
		}
		return Map.of();
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value.trim();
			}
		}
		return "";
	}
}
