package com.gcul.kyc.cache;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;

@Configuration
@EnableConfigurationProperties(FirestoreCacheProperties.class)
public class FirestoreConfig {

	@Bean
	ObjectMapper objectMapper() {
		return new ObjectMapper().findAndRegisterModules();
	}

	@Bean
	@ConditionalOnProperty(name = "gcul.firestore.enabled", havingValue = "true")
	Firestore firestore(FirestoreCacheProperties props) {
		FirestoreOptions.Builder builder = FirestoreOptions.newBuilder();
		if (props.getProjectId() != null && !props.getProjectId().isBlank()) {
			builder.setProjectId(props.getProjectId());
		}
		return builder.build().getService();
	}
}
