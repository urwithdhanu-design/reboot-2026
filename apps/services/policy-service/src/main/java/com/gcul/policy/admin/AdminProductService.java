package com.gcul.policy.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.catalog.ProductCatalogMapper;
import com.gcul.policy.model.InsurancePlan;
import com.gcul.policy.repository.InsurancePlanRepository;
import com.gcul.policy.service.PlanCatalogService;

@Service
public class AdminProductService {

	private final InsurancePlanRepository repository;
	private final PlanCatalogService catalog;

	public AdminProductService(InsurancePlanRepository repository, PlanCatalogService catalog) {
		this.repository = repository;
		this.catalog = catalog;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> listProducts() {
		List<InsurancePlan> plans = catalog.loadAllPlansFromDatabase();
		List<Map<String, Object>> products = plans.stream()
				.map(ProductCatalogMapper::toProductJson)
				.collect(Collectors.toList());
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("categories", PlanCatalogService.CATEGORIES);
		response.put("products", products);
		response.put("count", products.size());
		return response;
	}

	@Transactional
	public Map<String, Object> updateProduct(String productId, Map<String, Object> body) {
		InsurancePlan plan = repository.findById(productId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
		try {
			ProductCatalogMapper.applyUpdate(plan, body);
		}
		catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
		}
		repository.save(plan);
		catalog.refreshCache();
		return ProductCatalogMapper.toProductJson(plan);
	}

	@Transactional
	public Map<String, Object> refreshCache() {
		catalog.refreshCache();
		return Map.of("ok", true, "message", "Marketplace catalog synced to Firestore");
	}
}
