package com.gcul.policy.config;

import java.util.List;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import com.gcul.policy.security.JwtService;
import com.gcul.policy.security.PlatformAdminAuthFilter;

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
		registration.addUrlPatterns("/api/*");
		registration.setOrder(1);
		return registration;
	}
}
