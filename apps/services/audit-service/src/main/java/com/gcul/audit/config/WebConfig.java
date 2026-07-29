package com.gcul.audit.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.gcul.audit.security.JwtService;
import com.gcul.audit.security.PlatformAdminAuthFilter;

@Configuration
public class WebConfig {

	@Bean
	FilterRegistrationBean<PlatformAdminAuthFilter> platformAdminAuthFilter(JwtService jwtService) {
		FilterRegistrationBean<PlatformAdminAuthFilter> registration = new FilterRegistrationBean<>();
		registration.setFilter(new PlatformAdminAuthFilter(jwtService));
		registration.addUrlPatterns("/api/*");
		registration.setOrder(1);
		return registration;
	}
}
