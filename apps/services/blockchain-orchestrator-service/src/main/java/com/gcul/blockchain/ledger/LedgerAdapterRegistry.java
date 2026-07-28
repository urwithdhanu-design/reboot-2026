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
	 * preserves legacy fallback: canton offline → ethereum → simulated.
	 */
	public LedgerAdapter resolveMintAdapter() {
		String primaryId = primaryLedgerId();
		LedgerAdapter primary = requireAdapter(primaryId);
		if (primary.isActive()) {
			return primary;
		}
		if ("canton".equalsIgnoreCase(primaryId)) {
			LedgerAdapter ethereum = adaptersById.get("ethereum");
			if (ethereum != null && ethereum.isActive()) {
				return ethereum;
			}
		}
		return requireAdapter("simulated");
	}

	public Map<String, Object> allStatus() {
		Map<String, Object> status = new LinkedHashMap<>();
		status.put("primaryLedger", primaryLedgerId());
		status.put("secondaryLedgers", secondaryLedgerIds());
		Map<String, Object> adapters = new LinkedHashMap<>();
		for (LedgerAdapter adapter : adaptersById.values()) {
			adapters.put(adapter.ledgerId(), adapter.status());
		}
		status.put("adapters", adapters);
		return status;
	}
}
