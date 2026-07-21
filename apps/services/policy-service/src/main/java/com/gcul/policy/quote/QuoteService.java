package com.gcul.policy.quote;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.policy.mail.MailService;
import com.gcul.policy.model.InsurancePlan;
import com.gcul.policy.repository.InsurancePlanRepository;

@Service
public class QuoteService {

	private final InsurancePlanRepository plans;
	private final MailService mail;
	private final Map<String, Map<String, Object>> savedQuotes = new ConcurrentHashMap<>();

	public QuoteService(InsurancePlanRepository plans, MailService mail) {
		this.plans = plans;
		this.mail = mail;
	}

	public Map<String, Object> schemaFor(String category) {
		String key = normalizeCategory(category);
		if ("Health".equals(key)) {
			return healthWizardSchema();
		}
		if ("Property".equals(key)) {
			return homeWizardSchema();
		}

		List<Map<String, Object>> fields = switch (key) {
			case "Travel" -> List.of(
					field("destination", "Destination", "text", "e.g. Spain, France", true),
					field("trip_type", "Trip Type", "select", null, true,
							List.of("Single trip", "Annual multi-trip", "Backpacker")),
					field("departure_date", "Departure Date", "date", null, true),
					field("return_date", "Return Date", "date", null, true),
					field("travellers", "Number of travellers", "number", "1", true));
			case "Life" -> List.of(
					field("cover_amount", "Cover amount (£)", "number", "100000", true),
					field("term_years", "Policy term (years)", "number", "20", true),
					field("smoker", "Do you smoke?", "select", null, true, List.of("No", "Yes")),
					field("cover_start_date", "Cover start date", "date", null, true),
					field("email", "Email", "email", null, true));
			case "Vehicle" -> List.of(
					field("vehicle_type", "Vehicle type", "select", null, true,
							List.of("Car", "Van", "Motorcycle")),
					field("reg_year", "Registration year", "number", "2019", true),
					field("mileage", "Annual mileage", "number", "8000", true),
					field("driver_age", "Main driver age", "number", "35", true),
					field("cover_type", "Cover type", "select", null, true,
							List.of("Comprehensive", "Third party fire & theft", "Third party only")));
			case "Pet" -> List.of(
					field("pet_type", "Pet type", "select", null, true, List.of("Dog", "Cat")),
					field("pet_age", "Pet age (years)", "number", "3", true),
					field("breed", "Breed", "text", "e.g. Labrador", true),
					field("neutered", "Neutered / spayed?", "select", null, true, List.of("Yes", "No")),
					field("cover_level", "Cover level", "select", null, true,
							List.of("Accident only", "Accident & illness", "Lifetime")));
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Unsupported category for quote builder: " + category);
		};

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("category", key);
		response.put("flow", "form");
		response.put("title", key + " Quote Builder");
		response.put("total_steps", 2);
		response.put("steps", List.of(
				step(1, "Details", "Fill in your details", fields),
				step(2, "Quote", "Your Estimated Quote", List.of())));
		response.put("fields", fields);
		return response;
	}

	private Map<String, Object> healthWizardSchema() {
		List<Map<String, Object>> step1 = List.of(
				field("title", "Title", "select", null, true,
						List.of("Mr", "Mrs", "Miss", "Ms", "Dr", "Mx")),
				field("first_name", "First name", "text", null, true),
				field("last_name", "Last name", "text", null, true),
				field("dob_day", "Day", "number", "DD", true),
				field("dob_month", "Month", "number", "MM", true),
				field("dob_year", "Year", "number", "YYYY", true));

		List<Map<String, Object>> step2 = List.of(
				field("postcode", "Postcode", "text", "e.g. BH6 3LX", true));

		List<Map<String, Object>> step3 = List.of(
				field("cover_who", "Who would you like to cover?", "radio_cards", null, true,
						List.of("Myself", "Myself and others")));

		List<Map<String, Object>> step4 = List.of(
				field("cover_start_date", "Cover Start Date", "date", null, true));

		List<Map<String, Object>> step5 = List.of(
				field("email", "Email", "email", null, true),
				field("phone", "Phone", "tel", null, true));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("category", "Health");
		response.put("flow", "wizard");
		response.put("title", "Health Quote Builder");
		response.put("partner", "Vitality");
		response.put("total_steps", 5);
		response.put("steps", List.of(
				step(1, "Let's start with a few details",
						"Already got a quote? Access it here. You can also review our privacy policy.",
						step1),
				step(2, "What's your postcode?",
						"We'll use this to personalise your quote.",
						step2),
				step(3, "Who would you like to cover?",
						null,
						step3),
				step(4, "When do you want the plan to start?",
						null,
						step4),
				step(5, "Add your contact details",
						"You'll receive a copy of your quote and more details on the plan you're interested in.",
						step5)));
		response.put("fields", flattenFields(response));
		return response;
	}

	private Map<String, Object> homeWizardSchema() {
		List<Map<String, Object>> step1 = List.of();

		List<Map<String, Object>> step2 = List.of(
				field("title", "Title", "select", null, true,
						List.of("Mr", "Mrs", "Miss", "Ms", "Mx", "Other")),
				field("first_name", "First name", "text", null, true),
				field("last_name", "Last name", "text", null, true),
				field("email", "Email", "email", null, true),
				field("dob_day", "Day", "number", "DD", true),
				field("dob_month", "Month", "number", "MM", true),
				field("dob_year", "Year", "number", "YYYY", true));

		List<Map<String, Object>> step3 = List.of(
				field("address_confirmed", "Is this the property you wish to insure?", "select", null, true,
						List.of("Yes", "No")),
				field("address_line", "Address", "text", null, false));

		List<Map<String, Object>> step4 = List.of(
				field("assumptions_home", "Are all of these statements true?", "select", null, true,
						List.of("Yes", "No")));

		List<Map<String, Object>> step5 = List.of(
				field("assumptions_more", "Are all of these statements true?", "select", null, true,
						List.of("Yes", "No")));

		List<Map<String, Object>> step6 = List.of(
				field("cover_type", "Choose Your Cover", "radio_cards", null, true,
						List.of("Buildings and Contents", "Just Contents", "Just Buildings")));

		List<Map<String, Object>> step7 = List.of(
				field("second_policyholder", "Add a second policyholder?", "select", null, true,
						List.of("Yes", "No")));

		List<Map<String, Object>> step8 = List.of(
				field("cover_start_date", "Policy start date", "date", null, true));

		List<Map<String, Object>> step9 = List.of(
				field("claims_count", "Your claims history", "radio_cards", null, true,
						List.of("0 claims", "1 claim", "2 claims", "3+ claims")));

		List<Map<String, Object>> step10 = List.of(
				field("claim1_month", "Claim 1 month", "select", null, false,
						List.of("January", "February", "March", "April", "May", "June",
								"July", "August", "September", "October", "November", "December")),
				field("claim1_year", "Claim 1 year", "select", null, false,
						List.of("2026", "2025", "2024", "2023", "2022", "2021", "2020")),
				field("claim2_month", "Claim 2 month", "select", null, false,
						List.of("January", "February", "March", "April", "May", "June",
								"July", "August", "September", "October", "November", "December")),
				field("claim2_year", "Claim 2 year", "select", null, false,
						List.of("2026", "2025", "2024", "2023", "2022", "2021", "2020")));

		List<Map<String, Object>> step11 = List.of(
				field("insurance_years", "How long have you held home insurance?", "radio_cards", null, true,
						List.of("I've never had home insurance", "1 year", "2 years", "3 years",
								"4 years", "5+ years")));

		List<Map<String, Object>> step12 = List.of(
				field("away_cover", "Away from home cover", "select", null, true,
						List.of("Yes", "No")));

		List<Map<String, Object>> step13 = List.of(
				field("high_value_items", "Items worth more than £2,000", "select", null, true,
						List.of("Yes", "No")));

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("category", "Property");
		response.put("flow", "wizard");
		response.put("title", "Home Quote Builder");
		response.put("partner", "Reboot 2026");
		response.put("total_steps", 13);
		response.put("steps", List.of(
				step(1, "Get a quote", null, step1),
				step(2, "Your details",
						"Make sure these match official documents like your passport or driving licence.",
						step2),
				step(3, "Confirm your address",
						"Is this the property you wish to insure?",
						step3),
				step(4, "About you and your home",
						"Are all of these statements true?",
						step4),
				step(5, "More about you and your home",
						"Are all of these statements true?",
						step5),
				step(6, "Choose Your Cover", null, step6),
				step(7, "Add a second policyholder?", null, step7),
				step(8, "Policy start date",
						"Your cover can start today or up to 60 days in the future.",
						step8),
				step(9, "Your claims history",
						"How many home insurance claims have you made in the last 5 years?",
						step9),
				step(10, "Claim details",
						"Tell us about your recent claims.",
						step10),
				step(11, "How long have you held home insurance?", null, step11),
				step(12, "Away from home cover",
						"Would you like cover for your belongings when you're away from home?",
						step12),
				step(13, "Items worth more than £2,000",
						"Do you have any single items worth more than £2,000?",
						step13)));
		response.put("fields", flattenFields(response));
		return response;
	}

	@SuppressWarnings("unchecked")
	private List<Map<String, Object>> flattenFields(Map<String, Object> schema) {
		List<Map<String, Object>> all = new ArrayList<>();
		List<Map<String, Object>> steps = (List<Map<String, Object>>) schema.get("steps");
		for (Map<String, Object> s : steps) {
			Object fields = s.get("fields");
			if (fields instanceof List<?> list) {
				for (Object item : list) {
					if (item instanceof Map<?, ?> map) {
						all.add((Map<String, Object>) map);
					}
				}
			}
		}
		return all;
	}

	public Map<String, Object> estimate(String productId, Map<String, Object> answers) {
		InsurancePlan plan = plans.findById(productId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

		Map<String, Object> schema = schemaFor(plan.getCategory());
		@SuppressWarnings("unchecked")
		List<Map<String, Object>> fields = (List<Map<String, Object>>) schema.get("fields");
		for (Map<String, Object> fieldDef : fields) {
			String name = String.valueOf(fieldDef.get("name"));
			Object value = answers.get(name);
			boolean blank = value == null || String.valueOf(value).isBlank();
			// Only enforce required:true fields; skip empty optional fields (e.g. claim details)
			if (!Boolean.TRUE.equals(fieldDef.get("required"))) {
				continue;
			}
			if (blank) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing field: " + name);
			}
		}

		if ("Health".equals(plan.getCategory())) {
			validateHealthAge(answers);
		}

		double premium = calculatePremium(plan, answers);
		String quoteId = "Q-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);

		Map<String, Object> quote = new LinkedHashMap<>();
		quote.put("quote_id", quoteId);
		quote.put("product_id", plan.getId());
		quote.put("product_title", plan.getTitle());
		quote.put("category", plan.getCategory());
		quote.put("currency", plan.getCurrency());
		quote.put("estimated_premium", Math.round(premium * 100.0) / 100.0);
		quote.put("price_unit", plan.getPriceUnit());
		quote.put("answers", answers);
		quote.put("summary", answers);
		quote.put("message", "Your Estimated Quote");
		savedQuotes.put(quoteId, quote);

		String email = str(answers.get("email"));
		if (!email.isBlank()) {
			String customerName = firstNonBlank(
					str(answers.get("first_name")),
					str(answers.get("full_name")),
					"there");
			mail.sendQuoteReady(
					email,
					customerName,
					plan.getTitle(),
					quoteId,
					((Number) quote.get("estimated_premium")).doubleValue(),
					plan.getPriceUnit());
		}

		return quote;
	}

	public Map<String, Object> getQuote(String quoteId) {
		Map<String, Object> quote = savedQuotes.get(quoteId);
		if (quote == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quote not found");
		}
		return quote;
	}

	public List<Map<String, Object>> listQuotes() {
		return savedQuotes.values().stream()
				.map(q -> (Map<String, Object>) new LinkedHashMap<>(q))
				.toList();
	}

	public Map<String, Object> getProduct(String productId) {
		InsurancePlan plan = plans.findById(productId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", plan.getId());
		map.put("title", plan.getTitle());
		map.put("description", plan.getDescription());
		map.put("tagline", plan.getTagline() == null ? plan.getDescription() : plan.getTagline());
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

	private void validateHealthAge(Map<String, Object> answers) {
		int day = intVal(answers.get("dob_day"), 0);
		int month = intVal(answers.get("dob_month"), 0);
		int year = intVal(answers.get("dob_year"), 0);
		try {
			LocalDate dob = LocalDate.of(year, month, day);
			int age = Period.between(dob, LocalDate.now()).getYears();
			if (age < 18 || age > 79) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"To buy a plan, you must be between 18 and 79 years old");
			}
			answers.put("age", age);
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date of birth");
		}
	}

	private double calculatePremium(InsurancePlan plan, Map<String, Object> answers) {
		double base = plan.getPriceFrom();
		return switch (plan.getCategory()) {
			case "Travel" -> {
				int travellers = intVal(answers.get("travellers"), 1);
				String tripType = str(answers.get("trip_type")).toLowerCase(Locale.ROOT);
				double mult = tripType.contains("annual") ? 3.2 : tripType.contains("backpack") ? 1.6 : 1.0;
				yield base * Math.max(1, travellers) * mult;
			}
			case "Health" -> {
				int age = intVal(answers.get("age"), 30);
				double ageFactor = age > 50 ? 1.55 : age > 40 ? 1.25 : 1.0;
				String coverWho = str(answers.get("cover_who")).toLowerCase(Locale.ROOT);
				double people = coverWho.contains("others") ? 1.85 : 1.0;
				yield base * ageFactor * people;
			}
			case "Life" -> {
				double amount = doubleVal(answers.get("cover_amount"), 100000);
				int term = intVal(answers.get("term_years"), 20);
				double smoker = "yes".equalsIgnoreCase(str(answers.get("smoker"))) ? 1.4 : 1.0;
				yield Math.max(base, (amount / 100000.0) * 12 + term * 0.8) * smoker;
			}
			case "Vehicle" -> {
				int year = intVal(answers.get("reg_year"), 2019);
				int mileage = intVal(answers.get("mileage"), 8000);
				int driverAge = intVal(answers.get("driver_age"), 35);
				double ageFactor = year < 2015 ? 1.3 : year < 2018 ? 1.15 : 1.0;
				double milesFactor = mileage > 12000 ? 1.25 : mileage > 8000 ? 1.1 : 1.0;
				double driverFactor = driverAge < 25 ? 1.45 : driverAge > 70 ? 1.2 : 1.0;
				String cover = str(answers.get("cover_type")).toLowerCase(Locale.ROOT);
				double coverFactor = cover.contains("comprehensive") ? 1.0
						: cover.contains("fire") ? 0.75 : 0.55;
				yield base * ageFactor * milesFactor * driverFactor * coverFactor;
			}
			case "Pet" -> {
				int petAge = intVal(answers.get("pet_age"), 3);
				double ageFactor = petAge > 8 ? 1.5 : petAge > 5 ? 1.2 : 1.0;
				String level = str(answers.get("cover_level")).toLowerCase(Locale.ROOT);
				double levelFactor = level.contains("lifetime") ? 1.6
						: level.contains("illness") ? 1.25 : 0.85;
				String type = str(answers.get("pet_type")).toLowerCase(Locale.ROOT);
				double typeFactor = type.contains("dog") ? 1.15 : 1.0;
				yield base * ageFactor * levelFactor * typeFactor;
			}
			case "Property" -> {
				String cover = str(answers.get("cover_type")).toLowerCase(Locale.ROOT);
				double coverFactor = cover.contains("buildings and contents") ? 1.0
						: cover.contains("just contents") ? 0.55
								: cover.contains("just buildings") ? 0.7 : 1.0;
				String claims = str(answers.get("claims_count")).toLowerCase(Locale.ROOT);
				double claimsFactor = claims.startsWith("0") ? 1.0
						: claims.startsWith("1") ? 1.15
								: claims.startsWith("2") ? 1.3 : 1.5;
				double awayFactor = "yes".equalsIgnoreCase(str(answers.get("away_cover"))) ? 1.12 : 1.0;
				double highValueFactor = "yes".equalsIgnoreCase(str(answers.get("high_value_items")))
						? 1.18
						: 1.0;
				yield base * coverFactor * claimsFactor * awayFactor * highValueFactor;
			}
			default -> base;
		};
	}

	private static String normalizeCategory(String category) {
		if (category == null || category.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "category is required");
		}
		String key = category.trim().toLowerCase(Locale.ROOT);
		return switch (key) {
			case "travel" -> "Travel";
			case "health" -> "Health";
			case "vehicle" -> "Vehicle";
			case "pet" -> "Pet";
			case "property" -> "Property";
			case "life" -> "Life";
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Unsupported category for quote builder: " + category);
		};
	}

	private static Map<String, Object> step(int number, String title, String subtitle, List<Map<String, Object>> fields) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("step", number);
		map.put("title", title);
		if (subtitle != null) {
			map.put("subtitle", subtitle);
		}
		map.put("fields", fields);
		return map;
	}

	private static Map<String, Object> field(
			String name, String label, String type, String placeholder, boolean required) {
		return field(name, label, type, placeholder, required, null);
	}

	private static Map<String, Object> field(
			String name,
			String label,
			String type,
			String placeholder,
			boolean required,
			List<String> options) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("name", name);
		map.put("label", label);
		map.put("type", type);
		map.put("required", required);
		if (placeholder != null) {
			map.put("placeholder", placeholder);
		}
		if (options != null) {
			map.put("options", options);
		}
		return map;
	}

	private static int intVal(Object value, int fallback) {
		try {
			return Integer.parseInt(String.valueOf(value).trim());
		}
		catch (Exception ex) {
			return fallback;
		}
	}

	private static double doubleVal(Object value, double fallback) {
		try {
			return Double.parseDouble(String.valueOf(value).trim());
		}
		catch (Exception ex) {
			return fallback;
		}
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value);
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value.trim();
			}
		}
		return "";
	}
}
