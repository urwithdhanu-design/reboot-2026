package com.gcul.blockchain.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.blockchain.chain.InsuranceChainService;
import com.gcul.blockchain.model.ChainBlock;
import com.gcul.blockchain.model.ChainTransaction;
import com.gcul.blockchain.repository.ChainBlockRepository;
import com.gcul.blockchain.repository.ChainTransactionRepository;

@Service
public class ChainObservabilityService {

	private static final double FRAUD_ALERT_THRESHOLD = 0.45;

	private final InsuranceChainService chain;
	private final ChainBlockRepository blocks;
	private final ChainTransactionRepository transactions;

	public ChainObservabilityService(
			InsuranceChainService chain,
			ChainBlockRepository blocks,
			ChainTransactionRepository transactions) {
		this.chain = chain;
		this.blocks = blocks;
		this.transactions = transactions;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> snapshot() {
		Instant now = Instant.now();
		Instant since24h = now.minus(Duration.ofHours(24));

		List<ChainBlock> blockList = blocks.findAllByOrderByHeightAsc();
		List<ChainTransaction> allTx = transactions.findAll();
		List<ChainTransaction> pending = transactions.findByBlockHeightIsNullOrderByCreatedAtAsc();
		List<ChainTransaction> recent = allTx.stream()
				.filter(tx -> tx.getCreatedAt().isAfter(since24h))
				.sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
				.toList();

		Map<String, Long> byType = allTx.stream()
				.collect(Collectors.groupingBy(ChainTransaction::getType, Collectors.counting()));
		Map<String, Long> byLedger = allTx.stream()
				.collect(Collectors.groupingBy(ChainTransaction::getLedger, Collectors.counting()));

		List<Map<String, Object>> securityAlerts = buildSecurityAlerts(chain.validateChain(), pending, allTx);
		List<Map<String, Object>> traces = recent.stream()
				.limit(50)
				.map(this::traceRow)
				.toList();

		return Map.of(
				"generated_at", now.toString(),
				"network", chain.networkInfo(),
				"validation", chain.validateChain(),
				"dashboard", dashboardMetrics(blockList, allTx, pending, recent, since24h),
				"performance", performanceMetrics(blockList, allTx, pending),
				"security_alerts", securityAlerts,
				"transaction_traces", traces,
				"smart_contracts", smartContractRegistry(byType),
				"throughput_24h", throughputByHour(recent));
	}

	private Map<String, Object> dashboardMetrics(
			List<ChainBlock> blockList,
			List<ChainTransaction> allTx,
			List<ChainTransaction> pending,
			List<ChainTransaction> recent,
			Instant since24h) {
		long highFraud = allTx.stream()
				.filter(tx -> tx.getFraudScore() != null && tx.getFraudScore() >= FRAUD_ALERT_THRESHOLD)
				.count();
		return Map.of(
				"block_height", blockList.isEmpty() ? 0 : blockList.get(blockList.size() - 1).getHeight(),
				"total_transactions", allTx.size(),
				"transactions_24h", recent.size(),
				"mempool_pending", pending.size(),
				"fraud_flags", highFraud,
				"chain_valid", chain.validateChain().get("valid"),
				"ledgers_active", byLedgerCount(allTx));
	}

	private long byLedgerCount(List<ChainTransaction> allTx) {
		return allTx.stream().map(ChainTransaction::getLedger).distinct().count();
	}

	private Map<String, Object> performanceMetrics(
			List<ChainBlock> blockList,
			List<ChainTransaction> allTx,
			List<ChainTransaction> pending) {
		double avgBlockSeconds = 0;
		int intervals = 0;
		for (int i = 1; i < blockList.size(); i++) {
			long ms = Duration.between(blockList.get(i - 1).getMinedAt(), blockList.get(i).getMinedAt()).toMillis();
			if (ms > 0) {
				avgBlockSeconds += ms / 1000.0;
				intervals++;
			}
		}
		if (intervals > 0) {
			avgBlockSeconds /= intervals;
		}

		double avgTxPerBlock = 0;
		if (blockList.size() > 1) {
			long txInBlocks = allTx.stream().filter(tx -> tx.getBlockHeight() != null).count();
			avgTxPerBlock = txInBlocks / (double) (blockList.size() - 1);
		}

		double avgConfirmMs = 0;
		int confirmed = 0;
		for (ChainTransaction tx : allTx) {
			if (tx.getBlockHeight() == null) {
				continue;
			}
			for (ChainBlock block : blockList) {
				if (block.getHeight() == tx.getBlockHeight()) {
					long ms = Duration.between(tx.getCreatedAt(), block.getMinedAt()).toMillis();
					if (ms >= 0) {
						avgConfirmMs += ms;
						confirmed++;
					}
					break;
				}
			}
		}
		if (confirmed > 0) {
			avgConfirmMs /= confirmed;
		}

		return Map.of(
				"avg_block_time_seconds", Math.round(avgBlockSeconds * 10) / 10.0,
				"avg_tx_per_block", Math.round(avgTxPerBlock * 10) / 10.0,
				"avg_confirmation_ms", Math.round(avgConfirmMs),
				"mempool_size", pending.size(),
				"validator_id", chain.networkInfo().get("validator_id"));
	}

	private List<Map<String, Object>> buildSecurityAlerts(
			Map<String, Object> validation,
			List<ChainTransaction> pending,
			List<ChainTransaction> allTx) {
		List<Map<String, Object>> alerts = new ArrayList<>();
		if (!Boolean.TRUE.equals(validation.get("valid"))) {
			alerts.add(alert("critical", "CHAIN_INTEGRITY", "Insurance chain validation failed",
					String.valueOf(validation.get("errors"))));
		}
		if (pending.size() > 5) {
			alerts.add(alert("warning", "MEMPOOL_BACKLOG", "Mempool backlog detected",
					pending.size() + " transactions awaiting block inclusion"));
		}
		for (ChainTransaction tx : allTx) {
			if (tx.getFraudScore() != null && tx.getFraudScore() >= FRAUD_ALERT_THRESHOLD) {
				alerts.add(alert(
						tx.getFraudScore() >= 0.7 ? "critical" : "warning",
						"FRAUD_SCORE",
						"Elevated fraud risk on " + tx.getType(),
						"tx " + tx.getId() + " score " + tx.getFraudScore()));
			}
		}
		if (alerts.isEmpty()) {
			alerts.add(alert("info", "ALL_CLEAR", "No active security alerts", "Chain and mempool within normal bounds"));
		}
		return alerts.stream().limit(20).toList();
	}

	private Map<String, Object> alert(String severity, String code, String title, String detail) {
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("severity", severity);
		m.put("code", code);
		m.put("title", title);
		m.put("detail", detail);
		m.put("at", Instant.now().toString());
		return m;
	}

	private Map<String, Object> traceRow(ChainTransaction tx) {
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("trace_id", tx.getId());
		m.put("tx_hash", tx.getTxHash());
		m.put("type", tx.getType());
		m.put("ledger", tx.getLedger());
		m.put("status", tx.getBlockHeight() == null ? "pending" : "confirmed");
		m.put("block_height", tx.getBlockHeight());
		m.put("actor_id", tx.getActorId());
		m.put("actor_role", tx.getActorRole());
		m.put("fraud_score", tx.getFraudScore());
		m.put("created_at", tx.getCreatedAt().toString());
		m.put("payload_preview", truncate(tx.getPayloadJson(), 120));
		return m;
	}

	private List<Map<String, Object>> smartContractRegistry(Map<String, Long> byType) {
		long policyIssued = byType.getOrDefault("POLICY_ISSUED", 0L);
		long claimEvents = byType.getOrDefault("CLAIM_SUBMITTED", 0L)
				+ byType.getOrDefault("CLAIM_APPROVED", 0L)
				+ byType.getOrDefault("CLAIM_SETTLED", 0L);
		long workflow = byType.getOrDefault("WORKFLOW_STEP", 0L);

		return List.of(
				contract("PolicyNFT", "ERC-721", "active", "Policy issuance & token binding", policyIssued),
				contract("ClaimSettlement", "Workflow", "active", "Claim lifecycle & adjudication", claimEvents),
				contract("PremiumWorkflow", "PoA Chain", "active", "Premium & settlement orchestration", workflow));
	}

	private Map<String, Object> contract(
			String name, String standard, String status, String description, long invocations) {
		return Map.of(
				"name", name,
				"standard", standard,
				"status", status,
				"description", description,
				"invocations", invocations,
				"network", InsuranceChainService.NETWORK_NAME);
	}

	private List<Map<String, Object>> throughputByHour(List<ChainTransaction> recent) {
		Map<String, Long> buckets = new LinkedHashMap<>();
		for (int i = 23; i >= 0; i--) {
			Instant bucket = Instant.now().minus(Duration.ofHours(i)).truncatedTo(java.time.temporal.ChronoUnit.HOURS);
			buckets.put(bucket.toString(), 0L);
		}
		for (ChainTransaction tx : recent) {
			Instant bucket = tx.getCreatedAt().truncatedTo(java.time.temporal.ChronoUnit.HOURS);
			String key = bucket.toString();
			if (buckets.containsKey(key)) {
				buckets.put(key, buckets.get(key) + 1);
			}
		}
		return buckets.entrySet().stream()
				.map(e -> Map.<String, Object>of("hour", e.getKey(), "count", e.getValue()))
				.toList();
	}

	private static String truncate(String s, int max) {
		if (s == null) {
			return "";
		}
		return s.length() <= max ? s : s.substring(0, max) + "…";
	}
}
