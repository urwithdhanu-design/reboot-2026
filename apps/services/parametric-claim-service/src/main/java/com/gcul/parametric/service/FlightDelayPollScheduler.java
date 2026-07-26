package com.gcul.parametric.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.gcul.parametric.config.FlightOracleProperties;
import com.gcul.parametric.model.ParametricRule;
import com.gcul.parametric.repository.ParametricRuleRepository;
import com.gcul.parametric.repository.ParametricTriggerLogRepository;

@Service
public class FlightDelayPollScheduler {

	private static final Logger log = LoggerFactory.getLogger(FlightDelayPollScheduler.class);

	private final FlightOracleProperties properties;
	private final ParametricRuleRepository rules;
	private final ParametricTriggerLogRepository triggerLogs;
	private final FlightDelayOraclePoller poller;

	public FlightDelayPollScheduler(
			FlightOracleProperties properties,
			ParametricRuleRepository rules,
			ParametricTriggerLogRepository triggerLogs,
			FlightDelayOraclePoller poller) {
		this.properties = properties;
		this.rules = rules;
		this.triggerLogs = triggerLogs;
		this.poller = poller;
	}

	@EventListener(ApplicationReadyEvent.class)
	public void onStartup() {
		if (properties.isEnabled() && properties.isPollOnStartup()) {
			log.info("Running startup flight oracle poll");
			pollActiveRules();
		}
	}

	@Scheduled(fixedDelayString = "${gcul.flight-oracle.poll-interval-ms:300000}")
	public void scheduledPoll() {
		if (!properties.isEnabled()) {
			return;
		}
		pollActiveRules();
	}

	public Map<String, Object> pollActiveRules() {
		List<ParametricRule> activeRules = rules.findByActiveTrueOrderByCreatedAtDesc().stream()
				.filter(this::isFlightDelayRule)
				.filter(this::isWithinMonitoringWindow)
				.toList();

		int polled = 0;
		int triggered = 0;
		int skipped = 0;
		int errors = 0;

		for (ParametricRule rule : activeRules) {
			if (triggerLogs.existsByRuleIdAndTravelDateAndClaimCreatedTrue(rule.getId(), rule.getTravelDate())) {
				skipped++;
				continue;
			}
			try {
				Map<String, Object> result = poller.pollRule(rule, false);
				polled++;
				if (Boolean.TRUE.equals(result.get("claim_created"))) {
					triggered++;
				}
			}
			catch (Exception ex) {
				errors++;
				log.warn("Oracle poll failed for rule {}: {}", rule.getId(), ex.getMessage());
			}
		}

		Map<String, Object> summary = new LinkedHashMap<>();
		summary.put("polled", polled);
		summary.put("triggered", triggered);
		summary.put("skipped_already_settled", skipped);
		summary.put("errors", errors);
		summary.put("active_rules", activeRules.size());
		summary.put("polled_at", Instant.now().toString());
		return summary;
	}

	private boolean isFlightDelayRule(ParametricRule rule) {
		return "flight_delay".equalsIgnoreCase(rule.getRuleType())
				|| "flight_delay_minutes".equalsIgnoreCase(rule.getMetric());
	}

	private boolean isWithinMonitoringWindow(ParametricRule rule) {
		String travelDate = rule.getTravelDate();
		if (travelDate == null || travelDate.isBlank()) {
			return true;
		}
		try {
			LocalDate date = LocalDate.parse(travelDate);
			LocalDate today = LocalDate.now(ZoneOffset.UTC);
			if (date.isAfter(today.plusDays(1))) {
				return false;
			}
			if (rule.getPolicyExpiresAt() != null && !rule.getPolicyExpiresAt().isBlank()) {
				Instant expires = Instant.parse(rule.getPolicyExpiresAt());
				if (Instant.now().isAfter(expires.plusSeconds(86_400))) {
					return false;
				}
			}
			return true;
		}
		catch (Exception ex) {
			return true;
		}
	}
}
