package com.gcul.messaging.observability;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class ObservabilityRequestFilter extends OncePerRequestFilter {

	private final String serviceId;

	public ObservabilityRequestFilter(String serviceId) {
		this.serviceId = serviceId;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();
		return path.startsWith("/health")
				|| path.startsWith("/error")
				|| path.startsWith("/actuator");
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		long started = System.currentTimeMillis();
		try {
			filterChain.doFilter(request, response);
		}
		finally {
			long durationMs = System.currentTimeMillis() - started;
			if (request.getRequestURI().startsWith("/api/")) {
				Map<String, Object> trace = new LinkedHashMap<>();
				trace.put("service_id", serviceId);
				trace.put("method", request.getMethod());
				trace.put("path", request.getRequestURI());
				trace.put("status_code", response.getStatus());
				trace.put("duration_ms", durationMs);
				String query = request.getQueryString();
				if (query != null && !query.isBlank()) {
					trace.put("query_string", query.length() > 500 ? query.substring(0, 500) : query);
				}
				ObservabilityForwarder.forwardApiTrace(trace);
			}
		}
	}
}
