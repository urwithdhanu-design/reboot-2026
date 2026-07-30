package com.gcul.blockchain.canton;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.gcul.blockchain.config.CantonProperties;
import com.gcul.blockchain.config.LedgerProperties;
import com.gcul.blockchain.ledger.LedgerAdapterRegistry;

/**
 * Probes Canton JSON API directly — separate from orchestrator process health.
 */
@Component
public class CantonHealthProbe {

	private final CantonProperties cantonProperties;
	private final CantonJsonApiClient cantonJsonApiClient;
	private final CantonPolicyMintService cantonPolicyMintService;
	private final LedgerProperties ledgerProperties;
	private final LedgerAdapterRegistry ledgerRegistry;

	public CantonHealthProbe(
			CantonProperties cantonProperties,
			CantonJsonApiClient cantonJsonApiClient,
			CantonPolicyMintService cantonPolicyMintService,
			LedgerProperties ledgerProperties,
			LedgerAdapterRegistry ledgerRegistry) {
		this.cantonProperties = cantonProperties;
		this.cantonJsonApiClient = cantonJsonApiClient;
		this.cantonPolicyMintService = cantonPolicyMintService;
		this.ledgerProperties = ledgerProperties;
		this.ledgerRegistry = ledgerRegistry;
	}

	public Map<String, Object> probe() {
		Instant start = Instant.now();
		boolean reachable = cantonJsonApiClient.isReachable();
		long latencyMs = Duration.between(start, Instant.now()).toMillis();

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("service", "canton-json-api");
		body.put("enabled", cantonProperties.isEnabled());
		body.put("reachable", reachable);
		body.put("live", cantonPolicyMintService.isActive());
		body.put("latencyMs", latencyMs);
		body.put("jsonApiUrl", cantonProperties.getJsonApiUrl());
		body.put("ledgerId", cantonProperties.getLedgerId());
		body.put("network", cantonProperties.getNetwork());
		body.put("packageId", cantonProperties.getPackageId());
		body.put("insurerPartyHint", cantonProperties.getInsurerPartyHint());
		body.put("primaryLedger", ledgerProperties.resolvedPrimary());
		body.put("strictMode", ledgerProperties.isStrict());
		body.put("orchestratorUp", true);
		try {
			body.put("mintAdapter", ledgerRegistry.resolveMintAdapterId());
		}
		catch (Exception ex) {
			body.put("mintAdapter", "unavailable");
			body.put("mintAdapterError", ex.getMessage());
		}
		body.put("status", deriveStatus(reachable, cantonPolicyMintService.isActive()));
		body.put("checkedAt", Instant.now().toString());

		if (reachable) {
			try {
				String insurerParty = cantonJsonApiClient.resolveInsurerParty();
				body.put("insurerPartyResolved", true);
				body.put("insurerParty", insurerParty);
			}
			catch (Exception ex) {
				body.put("insurerPartyResolved", false);
				body.put("insurerPartyError", ex.getMessage());
			}
		}
		else {
			body.put("insurerPartyResolved", false);
			body.put("reason", "Canton JSON API not reachable at " + cantonProperties.getJsonApiUrl());
		}

		return body;
	}

	private static String deriveStatus(boolean reachable, boolean live) {
		if (live) {
			return "ok";
		}
		if (reachable) {
			return "degraded";
		}
		return "down";
	}
}
