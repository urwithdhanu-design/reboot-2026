package com.gcul.wallet.config;

import java.util.List;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import com.gcul.wallet.security.JwtAuthFilter;
import com.gcul.wallet.security.JwtService;
import com.gcul.wallet.security.PlatformAdminAuthFilter;

@Configuration
public class WebConfig {

	@Bean
	CorsFilter corsFilter() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowCredentials(true);
		config.setAllowedOriginPatterns(List.of("*"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return new CorsFilter(source);
	}

	@Bean
	FilterRegistrationBean<PlatformAdminAuthFilter> platformAdminAuthFilter(JwtService jwtService) {
		FilterRegistrationBean<PlatformAdminAuthFilter> registration = new FilterRegistrationBean<>();
		registration.setFilter(new PlatformAdminAuthFilter(jwtService));
		registration.addUrlPatterns("/api/admin/*");
		registration.setOrder(0);
		return registration;
	}

	@Bean
	FilterRegistrationBean<JwtAuthFilter> jwtFilter(JwtAuthFilter filter) {
		FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>();
		registration.setFilter(filter);
		registration.addUrlPatterns("/api/wallet", "/api/wallet/*");
		registration.setOrder(1);
		return registration;
	}
}
