package com.gcul.policy.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.policy.catalog.ProductCatalogMapper;
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
				.map(ProductCatalogMapper::toProductJson)
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
}
