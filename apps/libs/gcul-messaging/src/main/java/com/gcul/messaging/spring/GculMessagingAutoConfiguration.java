package com.gcul.messaging.spring;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

import com.gcul.messaging.GculEventPublisher;

@AutoConfiguration
@EnableConfigurationProperties(GculPubSubProperties.class)
public class GculMessagingAutoConfiguration {

	@Bean
	@ConditionalOnMissingBean
	GculEventPublisher gculEventPublisher(GculPubSubProperties properties) {
		return new GculEventPublisher(
				properties.isEnabled(),
				properties.getProjectId(),
				properties.getTopicPrefix(),
				properties.getServiceId());
	}
}
