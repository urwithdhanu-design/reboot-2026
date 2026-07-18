package com.gcul.policy.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.policy.model.InsurancePlan;
import com.gcul.policy.repository.InsurancePlanRepository;

@Component
public class PlanDataSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(PlanDataSeeder.class);

	private final InsurancePlanRepository repository;

	public PlanDataSeeder(InsurancePlanRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		List<InsurancePlan> seed = catalog();
		repository.saveAll(seed);
		log.info("Upserted {} insurance product cards", seed.size());
	}

	private static String bullets(String... items) {
		StringBuilder sb = new StringBuilder("[");
		for (int i = 0; i < items.length; i++) {
			if (i > 0) {
				sb.append(',');
			}
			sb.append('"').append(items[i].replace("\"", "\\\"")).append('"');
		}
		return sb.append(']').toString();
	}

	private static List<InsurancePlan> catalog() {
		return List.of(
				new InsurancePlan(
						"home-insurance",
						"Home insurance",
						"Protect your home and we’ll take care of you.",
						"Protect your home and we’ll take care of you.",
						bullets(
								"You can easily make claims online or by phone.",
								"You choose the excess for most claims and there are no hidden charges."),
						"Home insurance",
						"Property",
						22, "month", "GBP", 4.9, 401, true, "home"),
				new InsurancePlan(
						"life-insurance",
						"Life insurance",
						"Protect what matters most and get peace of mind.",
						"Protect what matters most and get peace of mind.",
						bullets(
								"Cover can act like a safety net. This could help your loved ones cope financially when you can't be there."),
						"Life insurance",
						"Life",
						15, "month", "GBP", 4.7, 210, true, "umbrella"),
				new InsurancePlan(
						"critical-illness",
						"Critical illness cover",
						"Protect yourself with critical illness cover.",
						"Protect yourself with critical illness cover.",
						bullets(
								"If you are diagnosed with a serious illness covered by your policy, this cover could help you and your loved ones meet day to day costs."),
						"Critical illness cover",
						"Health",
						28, "month", "GBP", 4.6, 188, true, "heart"),
				new InsurancePlan(
						"car-insurance",
						"Car insurance",
						"Choose either Gold or Silver and get cover that’s easy to manage online.",
						"Choose either Gold or Silver and get cover that’s easy to manage online.",
						bullets(),
						"Car insurance",
						"Vehicle",
						38, "month", "GBP", 4.5, 320, true, "car"),
				new InsurancePlan(
						"van-insurance",
						"Van insurance",
						"Get Gold or Silver cover for your van, whether you use it day-to-day or for your day job.",
						"Get Gold or Silver cover for your van, whether you use it day-to-day or for your day job.",
						bullets(),
						"Van insurance",
						"Vehicle",
						42, "month", "GBP", 4.4, 145, false, "van"),
				new InsurancePlan(
						"pet-insurance",
						"Pet insurance",
						"Reassuringly reliable pet insurance, without the fluff.",
						"Reassuringly reliable pet insurance, without the fluff.",
						bullets(
								"Choose from three levels of cover",
								"24/7 vet advice through video calls",
								"Manage your policy online"),
						"Pet insurance",
						"Pet",
						18, "month", "GBP", 4.8, 265, true, "paw"),
				new InsurancePlan(
						"health-plan",
						"Health Plan",
						"It's the hassle-free way to put your health first, from £18 a month. Brought to you in partnership with Vitality.",
						"It's the hassle-free way to put your health first, from £18 a month. Brought to you in partnership with Vitality.",
						bullets(
								"Price for Essential plan based on ages 18 to 79 - including insurance premium tax."),
						"Health Plan",
						"Health",
						18, "month", "GBP", 4.8, 512, true, "cross"),
				new InsurancePlan(
						"income-protection",
						"Income protection",
						"Losing your income because you can't work can be tough, but having a plan in place can make all the difference.",
						"Losing your income because you can't work can be tough, but having a plan in place can make all the difference.",
						bullets(),
						"Income protection",
						"Life",
						25, "month", "GBP", 4.5, 167, false, "coins"),
				new InsurancePlan(
						"travel-protect-plus",
						"Travel Protect Plus",
						"Comprehensive travel insurance for you and your loved ones",
						"Travel cover for holidays and getaways.",
						bullets(
								"Medical emergencies abroad",
								"Cancellation and delayed departure cover"),
						"Travel insurance",
						"Travel",
						25, "trip", "GBP", 4.8, 230, true, "plane"));
	}
}
