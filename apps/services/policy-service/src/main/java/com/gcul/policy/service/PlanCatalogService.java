package com.gcul.policy.service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.policy.cache.MarketplaceCatalogCache;
import com.gcul.policy.model.InsurancePlan;
import com.gcul.policy.repository.InsurancePlanRepository;

@Service
public class PlanCatalogService {

	public static final List<String> CATEGORIES = List.of(
			"All", "Health", "Vehicle", "Pet", "Property", "Life", "Travel");

	private final InsurancePlanRepository repository;
	private final MarketplaceCatalogCache catalogCache;

	public PlanCatalogService(InsurancePlanRepository repository, MarketplaceCatalogCache catalogCache) {
		this.repository = repository;
		this.catalogCache = catalogCache;
	}

	@Transactional(readOnly = true)
	public List<InsurancePlan> find(String category, String query) {
		final String categoryFilter;
		if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category.trim())) {
			categoryFilter = category.trim();
		}
		else {
			categoryFilter = null;
		}
		final String queryFilter = query == null || query.isBlank() ? null : query.trim().toLowerCase(Locale.ROOT);

		List<InsurancePlan> plans = loadAllPlans();
		return plans.stream()
				.filter(p -> matchesCategory(p, categoryFilter))
				.filter(p -> matchesQuery(p, queryFilter))
				.sorted(Comparator.comparing(InsurancePlan::getCategory).thenComparing(InsurancePlan::getTitle))
				.toList();
	}

	/** Load full catalog (Firestore cache → SQL, then refresh cache). */
	@Transactional(readOnly = true)
	public List<InsurancePlan> loadAllPlans() {
		var cached = catalogCache.loadPlansIfFresh();
		if (cached.isPresent()) {
			return cached.get();
		}
		List<InsurancePlan> plans = repository.findAll(Sort.by("category", "title"));
		catalogCache.storePlans(plans);
		return plans;
	}

	public void refreshCache() {
		catalogCache.storePlans(repository.findAll(Sort.by("category", "title")));
	}

	private static boolean matchesCategory(InsurancePlan plan, String category) {
		if (category == null) {
			return true;
		}
		return category.equalsIgnoreCase(plan.getCategory());
	}

	private static boolean matchesQuery(InsurancePlan plan, String q) {
		if (q == null) {
			return true;
		}
		return plan.getTitle().toLowerCase(Locale.ROOT).contains(q)
				|| plan.getDescription().toLowerCase(Locale.ROOT).contains(q);
	}
}
