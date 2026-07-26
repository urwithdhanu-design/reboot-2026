package com.gcul.parametric.oracle;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.gcul.parametric.config.FlightOracleProperties;

@Service
public class FlightDelayOracleService {

	private final FlightOracleProperties properties;
	private final List<FlightDelayOracle> oracles;

	public FlightDelayOracleService(FlightOracleProperties properties, List<FlightDelayOracle> oracles) {
		this.properties = properties;
		this.oracles = oracles;
	}

	public FlightDelaySnapshot lookup(String flightNumber, String travelDate) {
		if (!properties.isEnabled()) {
			return FlightDelaySnapshot.error(
					flightNumber,
					travelDate,
					"disabled",
					"Flight oracle is disabled");
		}
		return resolveOracle().lookup(flightNumber, travelDate);
	}

	public Map<String, Object> status() {
		FlightDelayOracle oracle = resolveOracle();
		Map<String, Object> status = new LinkedHashMap<>();
		status.put("enabled", properties.isEnabled());
		status.put("configured", properties.isConfigured());
		status.put("provider", oracle.providerId());
		status.put("poll_interval_ms", properties.getPollIntervalMs());
		status.put("api_key_set", properties.isConfigured());
		if (!properties.isConfigured()) {
			status.put(
					"message",
					"Set AVIATIONSTACK_API_KEY (provider=aviationstack) or RAPIDAPI_KEY (provider=aerodatabox)");
		}
		else {
			status.put("message", "Oracle ready — polling active flight delay rules");
		}
		return status;
	}

	private FlightDelayOracle resolveOracle() {
		String provider = properties.getProvider() == null
				? "aviationstack"
				: properties.getProvider().toLowerCase(Locale.ROOT);
		return oracles.stream()
				.filter(oracle -> oracle.providerId().equalsIgnoreCase(provider))
				.findFirst()
				.orElse(oracles.get(0));
	}
}
