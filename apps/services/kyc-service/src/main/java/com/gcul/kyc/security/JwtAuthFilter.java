package com.gcul.kyc.security;

import java.io.IOException;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.store.UserStore;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

	private static final Set<String> PUBLIC_PREFIXES = Set.of(
			"/api/auth/register",
			"/api/auth/login",
			"/api/auth/forgot-password",
			"/api/auth/reset-password",
			"/api/assistant",
			"/health",
			"/error");

	private final JwtService jwtService;
	private final UserStore userStore;

	public JwtAuthFilter(JwtService jwtService, UserStore userStore) {
		this.jwtService = jwtService;
		this.userStore = userStore;
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {

		String path = request.getRequestURI();
		if (isPublic(path) || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
			filterChain.doFilter(request, response);
			return;
		}

		String header = request.getHeader("Authorization");
		if (header == null || !header.startsWith("Bearer ")) {
			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			response.setContentType("application/json");
			response.getWriter().write("{\"detail\":\"Missing bearer token\"}");
			return;
		}

		try {
			Claims claims = jwtService.parse(header.substring(7));
			var user = userStore.findById(claims.getSubject())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
			request.setAttribute("currentUser", user);
			filterChain.doFilter(request, response);
		}
		catch (Exception ex) {
			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			response.setContentType("application/json");
			response.getWriter().write("{\"detail\":\"Invalid token\"}");
		}
	}

	private boolean isPublic(String path) {
		return PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
	}
}
