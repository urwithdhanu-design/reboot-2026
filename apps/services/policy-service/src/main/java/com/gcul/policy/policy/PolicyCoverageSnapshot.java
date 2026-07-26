package com.gcul.policy.policy;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public record PolicyCoverageSnapshot(
		String productCategory,
		Instant coverStartAt,
		Instant coverExpiresAt,
		Double coverageLimitGbp,
		String coverageSummary,
		List<Map<String, Object>> coverageItems) {

	public Map<String, Object> toEntityFields() {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("product_category", productCategory);
		map.put("cover_start_at", coverStartAt == null ? null : coverStartAt.toString());
		map.put("cover_expires_at", coverExpiresAt == null ? null : coverExpiresAt.toString());
		map.put("coverage_limit_gbp", coverageLimitGbp);
		map.put("coverage_summary", coverageSummary);
		map.put("coverage_items", coverageItems == null ? List.of() : coverageItems);
		return map;
	}

	public static List<Map<String, Object>> item(String code, String label, double limitGbp) {
		List<Map<String, Object>> list = new ArrayList<>();
		list.add(Map.of("code", code, "label", label, "limit_gbp", limitGbp));
		return list;
	}
}
