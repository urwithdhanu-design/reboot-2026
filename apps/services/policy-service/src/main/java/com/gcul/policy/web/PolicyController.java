package com.gcul.policy.web;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.policy.model.InsurancePlan;
import com.gcul.policy.service.PlanCatalogService;

@RestController
@RequestMapping("/api")
public class PolicyController {

	private final PlanCatalogService catalog;

	public PolicyController(PlanCatalogService catalog) {
		this.catalog = catalog;
	}

	@GetMapping("/products")
	public Map<String, Object> listProducts(
			@RequestParam(required = false) String category,
			@RequestParam(required = false) String q) {
		List<InsurancePlan> plans = catalog.find(category, q);
		List<Map<String, Object>> products = plans.stream()
				.map(this::toProductJson)
				.collect(Collectors.toList());

		Map<String, Object> response = new HashMap<>();
		response.put("categories", PlanCatalogService.CATEGORIES);
		response.put("products", products);
		return response;
	}

	@GetMapping("/policies/plans")
	public Map<String, Object> listPlans(
			@RequestParam(required = false) String category,
			@RequestParam(required = false) String q) {
		return listProducts(category, q);
	}

	private Map<String, Object> toProductJson(InsurancePlan plan) {
		Map<String, Object> map = new HashMap<>();
		map.put("id", plan.getId());
		map.put("title", plan.getTitle());
		map.put("description", plan.getDescription());
		map.put("tagline", plan.getTagline() == null ? plan.getDescription() : plan.getTagline());
		map.put("bullets", parseBullets(plan.getBulletsJson()));
		map.put("cta_label", plan.getCtaLabel() == null ? plan.getTitle() : plan.getCtaLabel());
		map.put("category", plan.getCategory());
		map.put("price_from", plan.getPriceFrom());
		map.put("price_unit", plan.getPriceUnit());
		map.put("currency", plan.getCurrency());
		map.put("rating", plan.getRating());
		map.put("review_count", plan.getReviewCount());
		map.put("best_seller", plan.isBestSeller());
		map.put("icon", plan.getIcon());
		return map;
	}

	private List<String> parseBullets(String json) {
		List<String> bullets = new ArrayList<>();
		if (json == null || json.isBlank() || "[]".equals(json.trim())) {
			return bullets;
		}
		String body = json.trim();
		if (body.startsWith("[") && body.endsWith("]")) {
			body = body.substring(1, body.length() - 1);
		}
		if (body.isBlank()) {
			return bullets;
		}
		for (String part : body.split("\",\"")) {
			String cleaned = part.replace("\"", "").trim();
			if (!cleaned.isEmpty()) {
				bullets.add(cleaned);
			}
		}
		return bullets;
	}
}
