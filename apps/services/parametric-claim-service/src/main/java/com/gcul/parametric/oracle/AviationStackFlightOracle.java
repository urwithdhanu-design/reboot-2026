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

@Component
public class AviationStackFlightOracle implements FlightDelayOracle {

	private static final Logger log = LoggerFactory.getLogger(AviationStackFlightOracle.class);

	private final FlightOracleProperties properties;
	private final RestClient restClient;

	public AviationStackFlightOracle(FlightOracleProperties properties) {
		this.properties = properties;
		this.restClient = RestClient.builder().baseUrl(properties.getBaseUrl()).build();
	}

	@Override
	public String providerId() {
		return "aviationstack";
	}

	@Override
	@SuppressWarnings("unchecked")
	public FlightDelaySnapshot lookup(String flightNumber, String travelDate) {
		if (!properties.isConfigured()) {
			return FlightDelaySnapshot.error(
					flightNumber,
					travelDate,
					providerId(),
					"AVIATIONSTACK_API_KEY is not configured");
		}

		String normalizedFlight = normalizeFlightNumber(flightNumber);
		try {
			Map<String, Object> response = restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/flights")
							.queryParam("access_key", properties.getApiKey())
							.queryParam("flight_iata", normalizedFlight)
							.queryParam("flight_date", travelDate)
							.build())
					.retrieve()
					.body(Map.class);

			if (response == null) {
				return FlightDelaySnapshot.notFound(normalizedFlight, travelDate, providerId(), "Empty response from AviationStack");
			}

			Object dataObj = response.get("data");
			if (!(dataObj instanceof List<?> data) || data.isEmpty()) {
				String apiError = extractApiError(response);
				return FlightDelaySnapshot.notFound(
						normalizedFlight,
						travelDate,
						providerId(),
						apiError == null ? "No flight data for " + normalizedFlight + " on " + travelDate : apiError);
			}

			Map<String, Object> flight = (Map<String, Object>) data.get(0);
			Map<String, Object> departure = map(flight.get("departure"));
			Map<String, Object> arrival = map(flight.get("arrival"));
			String status = str(flight.get("flight_status"));

			int delayMinutes = parseDelayMinutes(departure);
			String scheduled = str(departure.get("scheduled"));
			String actual = firstNonBlank(str(departure.get("actual")), str(departure.get("estimated")));

			return new FlightDelaySnapshot(
					normalizedFlight,
					travelDate,
					delayMinutes,
					status.isBlank() ? "unknown" : status,
					scheduled,
					actual,
					str(arrival.get("iata")),
					str(departure.get("iata")),
					providerId(),
					true,
					"Live delay from AviationStack",
					Instant.now());
		}
		catch (Exception ex) {
			log.warn("AviationStack lookup failed for {} on {}: {}", normalizedFlight, travelDate, ex.getMessage());
			return FlightDelaySnapshot.error(normalizedFlight, travelDate, providerId(), ex.getMessage());
		}
	}

	static int parseDelayMinutes(Map<String, Object> departure) {
		Object delayField = departure.get("delay");
		if (delayField != null) {
			try {
				return Math.max(0, (int) Math.round(Double.parseDouble(String.valueOf(delayField))));
			}
			catch (NumberFormatException ignored) {
				// compute from schedule vs actual
			}
		}

		String scheduled = str(departure.get("scheduled"));
		String actual = firstNonBlank(str(departure.get("actual")), str(departure.get("estimated")));
		if (scheduled.isBlank() || actual.isBlank()) {
			return 0;
		}
		try {
			Instant sched = parseInstant(scheduled);
			Instant act = parseInstant(actual);
			long minutes = Duration.between(sched, act).toMinutes();
			return (int) Math.max(0, minutes);
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

	private static String extractApiError(Map<String, Object> response) {
		Object error = response.get("error");
		if (error instanceof Map<?, ?> errorMap) {
			Object message = errorMap.get("message");
			if (message != null) {
				return String.valueOf(message);
			}
		}
		return null;
	}

	static String normalizeFlightNumber(String flightNumber) {
		String normalized = flightNumber == null ? "" : flightNumber.trim().toUpperCase(Locale.ROOT).replace(" ", "");
		return normalized;
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
