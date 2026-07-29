package com.gcul.claims.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatusCode;
import org.springframework.web.server.ResponseStatusException;

public class ClaimEvaluationException extends ResponseStatusException {

	private final String evaluationStep;
	private final String evaluationLabel;
	private final List<Map<String, Object>> evaluationSteps;

	public ClaimEvaluationException(
			HttpStatusCode status,
			String reason,
			String evaluationStep,
			String evaluationLabel,
			List<Map<String, Object>> evaluationSteps) {
		super(status, reason);
		this.evaluationStep = evaluationStep;
		this.evaluationLabel = evaluationLabel;
		this.evaluationSteps = evaluationSteps;
	}

	public String getEvaluationStep() {
		return evaluationStep;
	}

	public String getEvaluationLabel() {
		return evaluationLabel;
	}

	public List<Map<String, Object>> getEvaluationSteps() {
		return evaluationSteps;
	}
}
