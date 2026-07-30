package com.gcul.blockchain.security;

import java.io.IOException;

import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.gcul.blockchain.config.InternalApiProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(5)
public class InternalApiAuthFilter extends OncePerRequestFilter {

	public static final String HEADER_NAME = "X-Gcul-Internal-Key";

	private final InternalApiProperties properties;

	public InternalApiAuthFilter(InternalApiProperties properties) {
		this.properties = properties;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();
		return path == null || !path.startsWith("/api/blockchain/internal/");
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		if (!properties.isProtectionEnabled()) {
			filterChain.doFilter(request, response);
			return;
		}
		String provided = request.getHeader(HEADER_NAME);
		if (properties.getKey().equals(provided)) {
			filterChain.doFilter(request, response);
			return;
		}
		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write("{\"error\":\"Unauthorized internal API call\"}");
	}
}
