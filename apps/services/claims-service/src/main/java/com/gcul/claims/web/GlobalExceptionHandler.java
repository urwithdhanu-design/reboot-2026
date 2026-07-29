package com.gcul.claims.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ClaimEvaluationException.class)
	public ResponseEntity<Map<String, Object>> handleClaimEvaluation(ClaimEvaluationException ex) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("detail", ex.getReason() == null ? "Claim validation failed" : ex.getReason());
		body.put("evaluation_step", ex.getEvaluationStep());
		body.put("evaluation_label", ex.getEvaluationLabel());
		if (ex.getEvaluationSteps() != null && !ex.getEvaluationSteps().isEmpty()) {
			body.put("evaluation_steps", ex.getEvaluationSteps());
		}
		return ResponseEntity.status(ex.getStatusCode()).body(body);
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException ex) {
		return ResponseEntity.status(ex.getStatusCode())
				.body(Map.of("detail", ex.getReason() == null ? "Error" : ex.getReason()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
		String message = ex.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(err -> err.getField() + ": " + err.getDefaultMessage())
				.orElse("Validation failed");
		return ResponseEntity.badRequest().body(Map.of("detail", message));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Map.of("detail", ex.getMessage() == null ? "Internal error" : ex.getMessage()));
	}
}
