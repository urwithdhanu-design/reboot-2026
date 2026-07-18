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

	@PostMapping("/trigger")
	public Map<String, Object> trigger(@RequestBody Map<String, Object> body) {
		return parametric.trigger(body);
	}
}
