package com.gcul.payment.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class PlatformAdminAuthFilter extends OncePerRequestFilter {

	private final JwtService jwtService;

	public PlatformAdminAuthFilter(JwtService jwtService) {
		this.jwtService = jwtService;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();
		if (path.startsWith("/health") || path.startsWith("/error")) {
			return true;
		}
		return !path.startsWith("/api/payment-ledger");
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {

		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			filterChain.doFilter(request, response);
			return;
		}

		String header = request.getHeader("Authorization");
		if (header == null || !header.startsWith("Bearer ")) {
			unauthorized(response, "Missing bearer token");
			return;
		}

		try {
			Claims claims = jwtService.parse(header.substring(7));
			String role = claims.get("role", String.class);
			if (!PlatformRoles.isPlatformAdmin(role)) {
				forbidden(response, "Platform admin access required");
				return;
			}
			filterChain.doFilter(request, response);
		}
		catch (Exception ex) {
			unauthorized(response, "Invalid token");
		}
	}

	private static void unauthorized(HttpServletResponse response, String detail) throws IOException {
		response.setStatus(HttpStatus.UNAUTHORIZED.value());
		response.setContentType("application/json");
		response.getWriter().write("{\"detail\":\"" + detail + "\"}");
	}

	private static void forbidden(HttpServletResponse response, String detail) throws IOException {
		response.setStatus(HttpStatus.FORBIDDEN.value());
		response.setContentType("application/json");
		response.getWriter().write("{\"detail\":\"" + detail + "\"}");
	}
}
