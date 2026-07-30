package com.gcul.blockchain.canton;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.databind.JsonNode;
import com.gcul.blockchain.config.CantonProperties;

/**
 * Resolves Daml package ID from config or Canton JSON API {@code /v1/packages}.
 */
@Component
public class PackageIdResolver implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(PackageIdResolver.class);

	private final CantonProperties props;
	private final CantonJsonApiClient cantonJsonApiClient;
	private volatile String resolvedPackageId;

	public PackageIdResolver(CantonProperties props, CantonJsonApiClient cantonJsonApiClient) {
		this.props = props;
		this.cantonJsonApiClient = cantonJsonApiClient;
	}

	@Override
	public void run(ApplicationArguments args) {
		resolve().ifPresent(id -> {
			if (!id.equals(props.getPackageId())) {
				log.info("Resolved Canton package ID from ledger: {}", id);
			}
			props.setPackageId(id);
			resolvedPackageId = id;
		});
	}

	public String resolvedPackageId() {
		if (StringUtils.hasText(resolvedPackageId)) {
			return resolvedPackageId;
		}
		return resolve().orElseGet(() -> StringUtils.hasText(props.getPackageId()) ? props.getPackageId().trim() : "");
	}

	public Optional<String> resolve() {
		if (StringUtils.hasText(props.getPackageId())) {
			resolvedPackageId = props.getPackageId().trim();
			return Optional.of(resolvedPackageId);
		}
		if (!cantonJsonApiClient.isReachable()) {
			return Optional.empty();
		}
		try {
			JsonNode response = cantonJsonApiClient.getPackages();
			JsonNode result = response.path("result");
			if (!result.isArray()) {
				return Optional.empty();
			}
			List<String> packageIds = new ArrayList<>();
			for (JsonNode node : result) {
				String id = node.isTextual() ? node.asText() : node.path("packageId").asText("");
				if (StringUtils.hasText(id)) {
					packageIds.add(id.trim());
				}
			}
			if (packageIds.isEmpty()) {
				return Optional.empty();
			}
			resolvedPackageId = packageIds.get(packageIds.size() - 1);
			return Optional.of(resolvedPackageId);
		}
		catch (Exception ex) {
			log.debug("Could not list Canton packages: {}", ex.getMessage());
			return Optional.empty();
		}
	}
}
