package com.gcul.claims.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gcul.claims.model.ClaimStatus;
import com.gcul.claims.model.InsuranceClaim;

@Service
public class ClaimEvaluationService {

	public static final String POLICY_FOUND = "policy_found";
	public static final String POLICY_ELIGIBLE = "policy_eligible";
	public static final String COVER_ACTIVE = "cover_active";
	public static final String CATEGORY_MATCH = "category_match";
	public static final String COVERAGE_LIMIT = "coverage_limit";
	public static final String CANTON_VERIFY = "canton_verify";
	public static final String SUBMITTED = "submitted";
	public static final String PENDING_ADMIN = "pending_admin";
	public static final String ADMIN_REVIEW = "admin_review";
	public static final String CUSTOMER_QUERIES = "customer_queries";
	public static final String ADMIN_DECISION = "admin_decision";
	public static final String WALLET_PAYOUT = "wallet_payout";
	public static final String LEDGER_SETTLEMENT = "ledger_settlement";
	public static final String COMPLETE = "complete";

	private final ObjectMapper objectMapper;
	private final ThreadLocal<List<Map<String, Object>>> draftTrace = ThreadLocal.withInitial(ArrayList::new);

	public ClaimEvaluationService(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public void passDraft(String id, String label, String detail) {
		recordDraft(id, label, "passed", detail);
	}

	public void applyDraftToClaim(InsuranceClaim claim) {
		List<Map<String, Object>> draft = draftTrace.get();
		writeTrace(claim, new ArrayList<>(draft));
		draft.clear();
	}

	private void recordDraft(String id, String label, String status, String detail) {
		List<Map<String, Object>> draft = draftTrace.get();
		Map<String, Object> step = new LinkedHashMap<>();
		step.put("id", id);
		step.put("label", label);
		step.put("status", status);
		step.put("detail", detail == null ? "" : detail);
		step.put("at", Instant.now().toString());
		int existingIdx = indexOfStep(draft, id);
		if (existingIdx >= 0) {
			draft.set(existingIdx, step);
		}
		else {
			draft.add(step);
		}
	}

	public void failDraft(String id, String label, String detail) {
		recordDraft(id, label, "failed", detail);
	}

	public List<Map<String, Object>> snapshotDraft() {
		return new ArrayList<>(draftTrace.get());
	}

	public void record(InsuranceClaim claim, String id, String label, String status, String detail) {
		List<Map<String, Object>> trace = readTrace(claim);
		Map<String, Object> step = new LinkedHashMap<>();
		step.put("id", id);
		step.put("label", label);
		step.put("status", status);
		step.put("detail", detail == null ? "" : detail);
		step.put("at", Instant.now().toString());
		int existingIdx = indexOfStep(trace, id);
		if (existingIdx >= 0) {
			trace.set(existingIdx, step);
		}
		else {
			trace.add(step);
		}
		writeTrace(claim, trace);
	}

	public void pass(InsuranceClaim claim, String id, String label, String detail) {
		record(claim, id, label, "passed", detail);
	}

	public void fail(InsuranceClaim claim, String id, String label, String detail) {
		record(claim, id, label, "failed", detail);
	}

	public void pending(InsuranceClaim claim, String id, String label, String detail) {
		record(claim, id, label, "pending", detail);
	}

	public void actionRequired(InsuranceClaim claim, String id, String label, String detail) {
		record(claim, id, label, "action_required", detail);
	}

	public List<Map<String, Object>> resolveTrace(InsuranceClaim claim, long openQueryCount) {
		List<Map<String, Object>> stored = readTrace(claim);
		if (!stored.isEmpty()) {
			mergeLiveState(claim, stored, openQueryCount);
			return stored;
		}
		return inferTrace(claim, openQueryCount);
	}

	public String inferFailedStepId(String reason) {
		if (reason == null || reason.isBlank()) {
			return POLICY_FOUND;
		}
		String lower = reason.toLowerCase(Locale.ROOT);
		if (lower.contains("policy not found")) {
			return POLICY_FOUND;
		}
		if (lower.contains("cancelled") || lower.contains("not minted") || lower.contains("not active")
				|| lower.contains("mint must complete")) {
			return POLICY_ELIGIBLE;
		}
		if (lower.contains("cover has not") || lower.contains("coverage expired") || lower.contains("cover begins")) {
			return COVER_ACTIVE;
		}
		if (lower.contains("category") && lower.contains("match")) {
			return CATEGORY_MATCH;
		}
		if (lower.contains("coverage limit") || lower.contains("remaining policy coverage")
				|| lower.contains("fully used")) {
			return COVERAGE_LIMIT;
		}
		if (lower.contains("canton") || lower.contains("ledger") || lower.contains("certificate not found")) {
			return CANTON_VERIFY;
		}
		if (lower.contains("open quer")) {
			return CUSTOMER_QUERIES;
		}
		return ADMIN_DECISION;
	}

	public String labelForStep(String stepId) {
		return switch (stepId) {
			case POLICY_FOUND -> "Policy located";
			case POLICY_ELIGIBLE -> "Policy eligible for claims";
			case COVER_ACTIVE -> "Cover period active";
			case CATEGORY_MATCH -> "Claim category matches cover";
			case COVERAGE_LIMIT -> "Amount within coverage limit";
			case CANTON_VERIFY -> "Canton policy verification";
			case SUBMITTED -> "Claim submitted";
			case PENDING_ADMIN -> "Queued for admin review";
			case ADMIN_REVIEW -> "Admin review";
			case CUSTOMER_QUERIES -> "Customer information requests";
			case ADMIN_DECISION -> "Admin approval decision";
			case WALLET_PAYOUT -> "Wallet payout";
			case LEDGER_SETTLEMENT -> "Ledger settlement record";
			case COMPLETE -> "Claim complete";
			default -> "Evaluation step";
		};
	}

	private void mergeLiveState(InsuranceClaim claim, List<Map<String, Object>> trace, long openQueryCount) {
		if (ClaimStatus.REJECTED.equals(claim.getStatus())) {
			updateStepStatus(trace, ADMIN_DECISION, "failed", claim.getRejectionReason());
		}
		if (openQueryCount > 0) {
			actionRequiredOnTrace(trace, CUSTOMER_QUERIES,
					"Respond to admin queries before approval can continue");
		}
	}

	private List<Map<String, Object>> inferTrace(InsuranceClaim claim, long openQueryCount) {
		List<Map<String, Object>> trace = new ArrayList<>();
		boolean parametric = "parametric".equalsIgnoreCase(claim.getSource());
		boolean terminal = ClaimStatus.isTerminal(claim.getStatus());
		boolean rejected = ClaimStatus.REJECTED.equals(claim.getStatus());

		addInfer(trace, POLICY_FOUND, "Policy located", "passed", "Policy record found for " + claim.getPolicyRef());
		addInfer(trace, POLICY_ELIGIBLE, "Policy eligible for claims", "passed",
				"Policy was active and minted when claim was filed");
		addInfer(trace, COVER_ACTIVE, "Cover period active", "passed", "Cover dates valid at submission");
		if (!parametric) {
			addInfer(trace, CATEGORY_MATCH, "Claim category matches cover", "passed", claim.getCategory());
		}
		else {
			addInfer(trace, CATEGORY_MATCH, "Claim category matches cover", "passed",
					"Parametric event — category rules relaxed");
		}
		addInfer(trace, COVERAGE_LIMIT, "Amount within coverage limit", "passed",
				String.format(Locale.ROOT, "Claimed £%,.2f", claim.getAmountClaimed()));
		String cantonDetail = claim.getCantonContractId() != null && !claim.getCantonContractId().isBlank()
				? "Verified · contract " + claim.getCantonContractId()
				: "Verified on Canton ledger";
		addInfer(trace, CANTON_VERIFY, "Canton policy verification", "passed", cantonDetail);
		addInfer(trace, SUBMITTED, "Claim submitted", "passed", claim.getId());

		String status = claim.getStatus();
		if (ClaimStatus.PENDING_APPROVAL.equals(status) || ClaimStatus.IN_REVIEW.equals(status)
				|| ClaimStatus.AWAITING_CUSTOMER.equals(status) || isPastPending(status)) {
			addInfer(trace, PENDING_ADMIN, "Queued for admin review", "passed", "Awaiting platform review");
		}
		else if (!rejected) {
			addInfer(trace, PENDING_ADMIN, "Queued for admin review", "pending", "Not yet queued");
		}

		if (ClaimStatus.IN_REVIEW.equals(status) || isPastReview(status)) {
			addInfer(trace, ADMIN_REVIEW, "Admin review", "passed", "Claim under active review");
		}
		else if (ClaimStatus.PENDING_APPROVAL.equals(status)) {
			addInfer(trace, ADMIN_REVIEW, "Admin review", "pending", "Waiting for reviewer");
		}

		if (openQueryCount > 0) {
			addInfer(trace, CUSTOMER_QUERIES, "Customer information requests", "action_required",
					"Open admin queries — reply or upload documents");
		}
		else if (ClaimStatus.AWAITING_CUSTOMER.equals(status)) {
			addInfer(trace, CUSTOMER_QUERIES, "Customer information requests", "action_required",
					"Additional information required");
		}
		else if (isPastReview(status) && !rejected) {
			addInfer(trace, CUSTOMER_QUERIES, "Customer information requests", "passed", "No open queries");
		}

		if (rejected) {
			addInfer(trace, ADMIN_DECISION, "Admin approval decision", "failed",
					claim.getRejectionReason() != null ? claim.getRejectionReason() : "Claim rejected");
		}
		else if (isApprovedOrBeyond(status)) {
			addInfer(trace, ADMIN_DECISION, "Admin approval decision", "passed", "Claim approved");
		}
		else if (ClaimStatus.IN_REVIEW.equals(status) || ClaimStatus.PENDING_APPROVAL.equals(status)) {
			addInfer(trace, ADMIN_DECISION, "Admin approval decision", "pending", "Decision pending");
		}

		if (isPaidOrBeyond(status)) {
			double paid = claim.getApprovedAmount() != null ? claim.getApprovedAmount() : claim.getAmountClaimed();
			addInfer(trace, WALLET_PAYOUT, "Wallet payout", "passed",
					String.format(Locale.ROOT, "£%,.2f credited to wallet", paid));
		}
		else if (rejected) {
			addInfer(trace, WALLET_PAYOUT, "Wallet payout", "skipped", "Not paid — claim rejected");
		}
		else if (isApprovedOrBeyond(status)) {
			addInfer(trace, WALLET_PAYOUT, "Wallet payout", "pending", "Payout in progress");
		}

		if (ClaimStatus.SETTLED.equals(status) || ClaimStatus.PAID.equals(status)) {
			String settleDetail = claim.getSettlementTransactionId() != null
					&& !claim.getSettlementTransactionId().isBlank()
					? "Settlement recorded · " + claim.getSettlementTransactionId()
					: "Settlement complete";
			if (claim.getValidationNotes() != null && claim.getValidationNotes().contains("deferred")) {
				settleDetail = "Wallet paid; ledger settlement deferred (see notes)";
			}
			addInfer(trace, LEDGER_SETTLEMENT, "Ledger settlement record", "passed", settleDetail);
			addInfer(trace, COMPLETE, "Claim complete", "passed", "All steps finished");
		}
		else if (ClaimStatus.PAID_OUT.equals(status) || ClaimStatus.PAYMENT_PENDING.equals(status)) {
			addInfer(trace, LEDGER_SETTLEMENT, "Ledger settlement record", "pending", "Recording on-chain settlement");
		}
		else if (rejected) {
			addInfer(trace, LEDGER_SETTLEMENT, "Ledger settlement record", "skipped", "—");
			addInfer(trace, COMPLETE, "Claim complete", "failed", "Claim rejected");
		}
		else if (terminal) {
			addInfer(trace, COMPLETE, "Claim complete", "passed", status);
		}

		return trace;
	}

	private static boolean isPastPending(String status) {
		return ClaimStatus.IN_REVIEW.equals(status) || ClaimStatus.AWAITING_CUSTOMER.equals(status)
				|| isApprovedOrBeyond(status);
	}

	private static boolean isPastReview(String status) {
		return isApprovedOrBeyond(status) || ClaimStatus.AWAITING_CUSTOMER.equals(status);
	}

	private static boolean isApprovedOrBeyond(String status) {
		return ClaimStatus.APPROVED.equals(status) || ClaimStatus.PAYMENT_PENDING.equals(status)
				|| isPaidOrBeyond(status);
	}

	private static boolean isPaidOrBeyond(String status) {
		return ClaimStatus.PAID_OUT.equals(status) || ClaimStatus.SETTLED.equals(status)
				|| ClaimStatus.PAID.equals(status);
	}

	private static void addInfer(
			List<Map<String, Object>> trace,
			String id,
			String label,
			String status,
			String detail) {
		Map<String, Object> step = new LinkedHashMap<>();
		step.put("id", id);
		step.put("label", label);
		step.put("status", status);
		step.put("detail", detail);
		step.put("at", null);
		trace.add(step);
	}

	private static void updateStepStatus(
			List<Map<String, Object>> trace,
			String id,
			String status,
			String detail) {
		for (Map<String, Object> step : trace) {
			if (id.equals(step.get("id"))) {
				step.put("status", status);
				if (detail != null && !detail.isBlank()) {
					step.put("detail", detail);
				}
				return;
			}
		}
	}

	private static void actionRequiredOnTrace(List<Map<String, Object>> trace, String id, String detail) {
		updateStepStatus(trace, id, "action_required", detail);
	}

	private static int indexOfStep(List<Map<String, Object>> trace, String id) {
		for (int i = 0; i < trace.size(); i++) {
			if (id.equals(trace.get(i).get("id"))) {
				return i;
			}
		}
		return -1;
	}

	private List<Map<String, Object>> readTrace(InsuranceClaim claim) {
		String json = claim.getEvaluationTraceJson();
		if (json == null || json.isBlank()) {
			return new ArrayList<>();
		}
		try {
			return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
		}
		catch (Exception ex) {
			return new ArrayList<>();
		}
	}

	private void writeTrace(InsuranceClaim claim, List<Map<String, Object>> trace) {
		try {
			claim.setEvaluationTraceJson(objectMapper.writeValueAsString(trace));
		}
		catch (Exception ex) {
			claim.setEvaluationTraceJson("[]");
		}
	}
}
