package com.gcul.policy.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.policy.model.InsurancePlan;
import com.gcul.policy.repository.InsurancePlanRepository;

@Service
public class PlanCatalogService {

	public static final List<String> CATEGORIES = List.of(
			"All", "Health", "Vehicle", "Pet", "Property", "Life", "Travel");

	private final InsurancePlanRepository repository;

	public PlanCatalogService(InsurancePlanRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public List<InsurancePlan> find(String category, String query) {
		String normalizedCategory = null;
		if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category.trim())) {
			normalizedCategory = category.trim();
		}
		String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
		return repository.search(normalizedCategory, normalizedQuery);
	}
}
