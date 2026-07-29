package com.gcul.policy.policy;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;
import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.quote.QuoteService;

@Service
public class PolicyRenewalService {

	private static final long RENEWAL_WINDOW_MS = 30L * 24 * 60 * 60 * 1000;
	private static final long GRACE_MS = 7L * 24 * 60 * 60 * 1000;
	private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

	private final PolicyRecordService policyRecords;
	private final QuoteService quotes;
	private final GculEventPublisher publisher;
	private final ObjectMapper objectMapper;

	public PolicyRenewalService(
			PolicyRecordService policyRecords,
			QuoteService quotes,
			GculEventPublisher publisher,
			ObjectMapper objectMapper) {
		this.policyRecords = policyRecords;
		this.quotes = quotes;
		this.publisher = publisher;
		this.objectMapper = objectMapper;
	}

	public Map<String, Object> previewRenewal(String policyId, String customerId, String customerEmail) {
		PolicyRecord record = requireRenewablePolicy(policyId, customerId, customerEmail);
		String productId = resolveProductId(record);
		Map<String, Object> answers = resolveAnswers(record);
		Instant proposedStart = proposedCoverStart(record);
		answers = adjustAnswersForRenewal(record, answers, proposedStart);

		Map<String, Object> preview = new LinkedHashMap<>();
		preview.put("eligible", true);
		preview.put("policy_id", record.getPolicyId());
		preview.put("policy_number", record.getPolicyNumber());
		preview.put("product_id", productId);
		preview.put("product_title", record.getProductTitle());
		preview.put("current_cover_expires_at", record.getCoverExpiresAt() == null ? null : record.getCoverExpiresAt().toString());
		preview.put("proposed_cover_start_at", proposedStart.toString());
		preview.put("answers", answers);
		preview.put("renewal_window_days", 30);
		preview.put("message", "You can renew this policy for the next term. Premium is estimated from your existing cover details.");
		try {
			Map<String, Object> estimate = quotes.estimate(productId, answers);
			preview.put("estimated_premium", estimate.get("estimated_premium"));
			preview.put("currency", estimate.get("currency"));
			preview.put("price_unit", estimate.get("price_unit"));
		}
		catch (Exception ex) {
			preview.put("estimated_premium", null);
			preview.put("premium_note", "Complete any missing details to see premium.");
		}
		return preview;
	}

	public Map<String, Object> createRenewalQuote(String policyId, String customerId, String customerEmail) {
		PolicyRecord record = requireRenewablePolicy(policyId, customerId, customerEmail);
		String productId = resolveProductId(record);
		Map<String, Object> answers = resolveAnswers(record);
		Instant proposedStart = proposedCoverStart(record);
		answers = adjustAnswersForRenewal(record, answers, proposedStart);
		Map<String, Object> quote = quotes.createRenewalQuote(productId, answers, record.getPolicyId());
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("quote", quote);
		response.put("predecessor_policy_id", record.getPolicyId());
		response.put("proposed_cover_start_at", proposedStart.toString());
		return response;
	}

	private PolicyRecord requireRenewablePolicy(String policyId, String customerId, String customerEmail) {
		PolicyRecord record = policyRecords.findByPolicyId(policyId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found"));
		if (!ownsPolicy(record, customerId, customerEmail)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this policy");
		}
		if (policyRecords.isCancelled(record)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Cancelled policies cannot be renewed");
		}
		if (StringUtils.hasText(record.getRenewedByPolicyId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "This policy has already been renewed");
		}
		if (!"MINTED".equalsIgnoreCase(record.getMintStatus())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Policy must be active on Canton before renewal");
		}
		if (!isWithinRenewalWindow(record)) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"Renewal is only available within 30 days before expiry (or up to 7 days after)");
		}
		return record;
	}

	private boolean isWithinRenewalWindow(PolicyRecord record) {
		Instant expires = record.getCoverExpiresAt();
		if (expires == null) {
			return false;
		}
		long now = Instant.now().toEpochMilli();
		long end = expires.toEpochMilli();
		return now >= end - RENEWAL_WINDOW_MS && now <= end + GRACE_MS;
	}

	private Instant proposedCoverStart(PolicyRecord record) {
		Instant expires = record.getCoverExpiresAt();
		if (expires == null) {
			return Instant.now().plus(1, ChronoUnit.DAYS);
		}
		Instant dayAfterExpiry = expires.plus(1, ChronoUnit.DAYS);
		if (Instant.now().isAfter(expires)) {
			return Instant.now().plus(1, ChronoUnit.HOURS);
		}
		return dayAfterExpiry;
	}

	private Map<String, Object> adjustAnswersForRenewal(
			PolicyRecord record,
			Map<String, Object> answers,
			Instant proposedStart) {
		Map<String, Object> adjusted = new LinkedHashMap<>(answers);
		String startDate = DATE_FMT.format(LocalDate.ofInstant(proposedStart, ZoneOffset.UTC));
		adjusted.put("cover_start_date", startDate);
		if ("Travel".equalsIgnoreCase(PolicyCoverageResolver.normalizeProductCategory(
				record.getProductCategory(), record.getProductTitle()))) {
			LocalDate start = LocalDate.ofInstant(proposedStart, ZoneOffset.UTC);
			adjusted.put("departure_date", startDate);
			if (!str(adjusted.get("return_date")).isBlank()) {
				try {
					LocalDate oldReturn = LocalDate.parse(str(adjusted.get("return_date")));
					LocalDate oldStart = str(adjusted.get("departure_date")).isBlank()
							? oldReturn.minusDays(7)
							: LocalDate.parse(str(adjusted.get("departure_date")));
					long tripDays = Math.max(1, ChronoUnit.DAYS.between(oldStart, oldReturn));
					adjusted.put("return_date", start.plusDays(tripDays).format(DATE_FMT));
				}
				catch (Exception ignored) {
					adjusted.put("return_date", start.plusDays(7).format(DATE_FMT));
				}
			}
		}
		return adjusted;
	}

	private String resolveProductId(PolicyRecord record) {
		if (StringUtils.hasText(record.getProductId())) {
			return record.getProductId().trim();
		}
		if (StringUtils.hasText(record.getQuoteId())) {
			try {
				Map<String, Object> quote = quotes.getQuote(record.getQuoteId());
				String productId = str(quote.get("product_id"));
				if (!productId.isBlank()) {
					return productId;
				}
			}
			catch (Exception ignored) {
				// fall through
			}
		}
		throw new ResponseStatusException(
				HttpStatus.CONFLICT,
				"Cannot renew — product details are missing. Please request a new quote.");
	}

	private Map<String, Object> resolveAnswers(PolicyRecord record) {
		if (StringUtils.hasText(record.getQuoteAnswersJson())) {
			try {
				return objectMapper.readValue(record.getQuoteAnswersJson(), new TypeReference<>() {
				});
			}
			catch (Exception ignored) {
				// fall through
			}
		}
		if (StringUtils.hasText(record.getQuoteId())) {
			try {
				Map<String, Object> quote = quotes.getQuote(record.getQuoteId());
				Object answers = quote.get("answers");
				if (answers instanceof Map<?, ?> map) {
					@SuppressWarnings("unchecked")
					Map<String, Object> typed = (Map<String, Object>) map;
					return new LinkedHashMap<>(typed);
				}
			}
			catch (Exception ignored) {
				// fall through
			}
		}
		return new LinkedHashMap<>();
	}

	public void publishRenewed(PolicyRecord predecessor, PolicyRecord renewal) {
		Map<String, Object> event = new LinkedHashMap<>();
		event.put("eventType", "PolicyRenewed");
		event.put("policyId", renewal.getPolicyId());
		event.put("predecessorPolicyId", predecessor.getPolicyId());
		event.put("customerId", renewal.getCustomerId());
		event.put("customerEmail", renewal.getCustomerEmail());
		event.put("productTitle", renewal.getProductTitle());
		event.put("quoteId", renewal.getQuoteId());
		publisher.publish(EventTopics.POLICY, event);
	}

	private static boolean ownsPolicy(PolicyRecord record, String customerId, String customerEmail) {
		if (StringUtils.hasText(customerId) && customerId.equals(record.getCustomerId())) {
			return true;
		}
		if (StringUtils.hasText(customerEmail)
				&& customerEmail.equalsIgnoreCase(record.getCustomerEmail())) {
			return true;
		}
		return false;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}
}
