package com.gcul.messaging.spring;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

import com.gcul.messaging.audit.AuditForwarder;
import com.gcul.messaging.audit.AuditHttpClient;
import com.gcul.messaging.observability.ObservabilityForwarder;
import com.gcul.messaging.observability.ObservabilityHttpClient;
import com.gcul.messaging.observability.ObservabilityRequestFilter;

@AutoConfiguration
@ConditionalOnWebApplication
@EnableConfigurationProperties({ GculPubSubProperties.class, ObservabilityProperties.class, AuditProperties.class })
public class ObservabilityAutoConfiguration {

	@Bean
	AuditHttpClient auditHttpClient(AuditProperties audit) {
		boolean on = audit.isEnabled() && audit.getUrl() != null && !audit.getUrl().isBlank();
		AuditHttpClient client = new AuditHttpClient(on, audit.getUrl());
		AuditForwarder.bind(client);
		return client;
	}

	@Bean
	ObservabilityHttpClient observabilityHttpClient(
			ObservabilityProperties observability,
			GculPubSubProperties pubSub) {
		boolean on = observability.isEnabled() && observability.getUrl() != null
				&& !observability.getUrl().isBlank();
		ObservabilityHttpClient client = new ObservabilityHttpClient(on, observability.getUrl());
		ObservabilityForwarder.bind(client);
		return client;
	}

	@Bean
	@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
			prefix = "gcul.observability",
			name = "enabled",
			havingValue = "true",
			matchIfMissing = true)
	FilterRegistrationBean<ObservabilityRequestFilter> observabilityRequestFilter(
			GculPubSubProperties pubSub) {
		FilterRegistrationBean<ObservabilityRequestFilter> registration = new FilterRegistrationBean<>();
		registration.setFilter(new ObservabilityRequestFilter(pubSub.getServiceId()));
		registration.addUrlPatterns("/api/*");
		registration.setOrder(0);
		return registration;
	}
}
