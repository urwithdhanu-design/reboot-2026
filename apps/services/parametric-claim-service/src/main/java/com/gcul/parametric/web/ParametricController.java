package com.gcul.parametric.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.parametric.service.ParametricTriggerService;

@RestController
@RequestMapping("/api/parametric")
public class ParametricController {

	private final ParametricTriggerService parametric;

	public ParametricController(ParametricTriggerService parametric) {
		this.parametric = parametric;
	}

	@GetMapping("/rules")
	public Map<String, Object> rules() {
		List<Map<String, Object>> items = parametric.listRules();
		return Map.of("rules", items, "count", items.size());
	}

	@PostMapping("/rules")
	public Map<String, Object> createRule(@RequestBody Map<String, Object> body) {
		return parametric.createRule(body);
	}

	@GetMapping("/triggers")
	public Map<String, Object> triggers() {
		List<Map<String, Object>> items = parametric.listTriggerLogs();
		return Map.of("triggers", items, "count", items.size());
	}

	@PostMapping("/trigger")
	public Map<String, Object> trigger(@RequestBody Map<String, Object> body) {
		return parametric.trigger(body);
	}

	/** Simulate flight delay oracle — publishes ClaimInitiated and auto-settles if rule matches. */
	@PostMapping("/simulate/flight-delay")
	public Map<String, Object> simulateFlightDelay(@RequestBody Map<String, Object> body) {
		return parametric.simulateFlightDelay(body);
	}

	@PostMapping("/simulate/trip-cancellation")
	public Map<String, Object> simulateTripCancellation(@RequestBody Map<String, Object> body) {
		return parametric.simulateTripCancellation(body);
	}

	@GetMapping("/oracle/status")
	public Map<String, Object> oracleStatus() {
		return parametric.oracleStatus();
	}

	@PostMapping("/oracle/poll")
	public Map<String, Object> pollOracle(@RequestBody(required = false) Map<String, Object> body) {
		return parametric.pollOracle(body == null ? Map.of() : body);
	}

	@PostMapping("/oracle/poll/{ruleId}")
	public Map<String, Object> pollOracleRule(@org.springframework.web.bind.annotation.PathVariable String ruleId) {
		return parametric.pollOracleForRule(ruleId);
	}

	/** Fetch live delay from external oracle and auto-trigger claim when threshold met. */
	@PostMapping("/trigger/oracle")
	public Map<String, Object> triggerFromOracle(@RequestBody Map<String, Object> body) {
		return parametric.triggerFromOracle(body);
	}
}
