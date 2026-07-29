package com.gcul.policy.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class CustomerAuthFilter extends OncePerRequestFilter {

	private final JwtService jwtService;

	public CustomerAuthFilter(JwtService jwtService) {
		this.jwtService = jwtService;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();
		if (path.startsWith("/api/policies/me")) {
			return false;
		}
		// Customer policy actions must carry the JWT so the controller can enforce
		// ownership before sending a renewal to the Canton minting workflow.
		return !path.matches("/api/policies/[^/]+/(cancel|renew).*" );
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
			request.setAttribute("userId", claims.getSubject());
			request.setAttribute("userEmail", claims.get("email", String.class));
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
}
