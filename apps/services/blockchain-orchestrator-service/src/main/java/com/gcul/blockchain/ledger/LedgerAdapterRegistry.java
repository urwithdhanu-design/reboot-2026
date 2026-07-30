package com.gcul.blockchain.ledger;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.blockchain.config.LedgerProperties;

@Component
public class LedgerAdapterRegistry {

	private final LedgerProperties ledgerProperties;
	private final Map<String, LedgerAdapter> adaptersById;

	public LedgerAdapterRegistry(LedgerProperties ledgerProperties, List<LedgerAdapter> adapters) {
		this.ledgerProperties = ledgerProperties;
		this.adaptersById = adapters.stream()
				.collect(Collectors.toMap(
						adapter -> adapter.ledgerId().toLowerCase(),
						Function.identity(),
						(existing, duplicate) -> existing,
						LinkedHashMap::new));
	}

	public String primaryLedgerId() {
		return ledgerProperties.resolvedPrimary();
	}

	public List<String> secondaryLedgerIds() {
		return ledgerProperties.secondaryLedgers();
	}

	public LedgerAdapter primaryAdapter() {
		return requireAdapter(primaryLedgerId());
	}

	public LedgerAdapter requireAdapter(String ledgerId) {
		LedgerAdapter adapter = adaptersById.get(ledgerId.toLowerCase());
		if (adapter == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown ledger: " + ledgerId);
		}
		return adapter;
	}

	/**
	 * Resolves the adapter for minting. Honors {@code gcul.ledger.primary} when active;
	 * falls back to simulated when Canton is unavailable unless {@code gcul.ledger.strict} is true.
	 */
	public LedgerAdapter resolveMintAdapter() {
		String primaryId = primaryLedgerId();
		LedgerAdapter primary = requireAdapter(primaryId);
		if (primary.isActive()) {
			return primary;
		}
		if (ledgerProperties.isStrict()) {
			throw new ResponseStatusException(
					HttpStatus.SERVICE_UNAVAILABLE,
					"Canton ledger unavailable — strict mode prevents simulated fallback");
		}
		return requireAdapter("simulated");
	}

	public String resolveMintAdapterId() {
		return resolveMintAdapter().ledgerId();
	}

	public Map<String, Object> mintAdapterStatus() {
		Map<String, Object> status = new LinkedHashMap<>();
		status.put("strictMode", ledgerProperties.isStrict());
		String primaryId = primaryLedgerId();
		LedgerAdapter primary = requireAdapter(primaryId);
		status.put("primaryLedger", primaryId);
		if (primary.isActive()) {
			status.put("activeLedger", primaryId);
			status.putAll(primary.status());
			return status;
		}
		if (ledgerProperties.isStrict()) {
			status.put("activeLedger", "unavailable");
			status.put("live", false);
			status.put("mode", "canton-unavailable-strict");
			status.put("fallback", false);
			status.putAll(primary.status());
			return status;
		}
		LedgerAdapter simulated = requireAdapter("simulated");
		status.put("activeLedger", simulated.ledgerId());
		status.put("fallback", true);
		status.putAll(simulated.status());
		return status;
	}

	public Map<String, Object> allStatus() {
		Map<String, Object> status = new LinkedHashMap<>();
		status.put("primaryLedger", primaryLedgerId());
		status.put("strictMode", ledgerProperties.isStrict());
		status.put("secondaryLedgers", secondaryLedgerIds());
		Map<String, Object> adapters = new LinkedHashMap<>();
		for (LedgerAdapter adapter : adaptersById.values()) {
			adapters.put(adapter.ledgerId(), adapter.status());
		}
		status.put("adapters", adapters);
		return status;
	}
}
