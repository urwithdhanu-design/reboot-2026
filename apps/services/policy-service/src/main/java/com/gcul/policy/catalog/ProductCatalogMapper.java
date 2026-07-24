package com.gcul.policy.catalog;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.gcul.policy.model.InsurancePlan;

public final class ProductCatalogMapper {

	private ProductCatalogMapper() {
	}

	public static Map<String, Object> toProductJson(InsurancePlan plan) {
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

	public static void applyUpdate(InsurancePlan plan, Map<String, Object> body) {
		if (body.containsKey("title")) {
			plan.setTitle(requiredString(body.get("title"), "title"));
		}
		if (body.containsKey("description")) {
			plan.setDescription(requiredString(body.get("description"), "description"));
		}
		if (body.containsKey("tagline")) {
			plan.setTagline(stringOrNull(body.get("tagline")));
		}
		if (body.containsKey("cta_label")) {
			plan.setCtaLabel(stringOrNull(body.get("cta_label")));
		}
		if (body.containsKey("category")) {
			plan.setCategory(requiredString(body.get("category"), "category"));
		}
		if (body.containsKey("price_from")) {
			plan.setPriceFrom(doubleVal(body.get("price_from")));
		}
		if (body.containsKey("price_unit")) {
			plan.setPriceUnit(requiredString(body.get("price_unit"), "price_unit"));
		}
		if (body.containsKey("currency")) {
			plan.setCurrency(requiredString(body.get("currency"), "currency"));
		}
		if (body.containsKey("rating")) {
			plan.setRating(doubleVal(body.get("rating")));
		}
		if (body.containsKey("review_count")) {
			plan.setReviewCount(intVal(body.get("review_count")));
		}
		if (body.containsKey("best_seller")) {
			plan.setBestSeller(Boolean.TRUE.equals(body.get("best_seller")));
		}
		if (body.containsKey("icon")) {
			plan.setIcon(requiredString(body.get("icon"), "icon"));
		}
		if (body.containsKey("bullets")) {
			plan.setBulletsJson(bulletsToJson(body.get("bullets")));
		}
	}

	private static String bulletsToJson(Object bullets) {
		if (!(bullets instanceof List<?> list)) {
			return "[]";
		}
		StringBuilder sb = new StringBuilder("[");
		for (int i = 0; i < list.size(); i++) {
			if (i > 0) {
				sb.append(',');
			}
			sb.append('"').append(String.valueOf(list.get(i)).replace("\"", "\\\"")).append('"');
		}
		sb.append(']');
		return sb.toString();
	}

	private static List<String> parseBullets(String json) {
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

	private static String requiredString(Object value, String field) {
		String s = stringOrNull(value);
		if (s == null || s.isBlank()) {
			throw new IllegalArgumentException(field + " is required");
		}
		return s;
	}

	private static String stringOrNull(Object value) {
		return value == null ? null : String.valueOf(value).trim();
	}

	private static double doubleVal(Object value) {
		if (value instanceof Number n) {
			return n.doubleValue();
		}
		return Double.parseDouble(String.valueOf(value));
	}

	private static int intVal(Object value) {
		if (value instanceof Number n) {
			return n.intValue();
		}
		return Integer.parseInt(String.valueOf(value));
	}
}
