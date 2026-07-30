package com.gcul.blockchain.canton;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import com.gcul.blockchain.config.CantonKitTestProperties;
import com.gcul.blockchain.config.InternalApiProperties;
import com.gcul.blockchain.ledger.LedgerAdapter;
import com.gcul.blockchain.ledger.LedgerAdapterRegistry;
import com.gcul.blockchain.ledger.LedgerAttestation;
import com.gcul.blockchain.ledger.PolicyNftMintResult;
import com.gcul.blockchain.messaging.PolicyMintService;
import com.gcul.blockchain.security.InternalApiAuthFilter;
import com.gcul.blockchain.config.CantonProperties;

@Service
public class CantonKitTestService {

	private static final String KIT_WALLET = "0x0000000000000000000000000000000000000001";

	private final CantonKitTestProperties kitTestProperties;
	private final CantonHealthProbe healthProbe;
	private final CantonPolicyMintService cantonPolicyMintService;
	private final CantonCapitalMarketService capitalMarketService;
	private final LedgerReconciliationService reconciliationService;
	private final PolicyMintService policyMintService;
	private final LedgerAdapterRegistry ledgerRegistry;
	private final CantonProperties cantonProperties;
	private final InternalApiProperties internalApiProperties;
	private final CantonDamlScriptRunner damlScriptRunner;
	private final RestTemplate restTemplate;
	private final int serverPort;

	public CantonKitTestService(
			CantonKitTestProperties kitTestProperties,
			CantonHealthProbe healthProbe,
			CantonPolicyMintService cantonPolicyMintService,
			CantonCapitalMarketService capitalMarketService,
			LedgerReconciliationService reconciliationService,
			PolicyMintService policyMintService,
			LedgerAdapterRegistry ledgerRegistry,
			CantonProperties cantonProperties,
			InternalApiProperties internalApiProperties,
			CantonDamlScriptRunner damlScriptRunner,
			RestTemplateBuilder restTemplateBuilder,
			@Value("${server.port:8088}") int serverPort) {
		this.kitTestProperties = kitTestProperties;
		this.healthProbe = healthProbe;
		this.cantonPolicyMintService = cantonPolicyMintService;
		this.capitalMarketService = capitalMarketService;
		this.reconciliationService = reconciliationService;
		this.policyMintService = policyMintService;
		this.ledgerRegistry = ledgerRegistry;
		this.cantonProperties = cantonProperties;
		this.internalApiProperties = internalApiProperties;
		this.damlScriptRunner = damlScriptRunner;
		this.restTemplate = restTemplateBuilder
				.setConnectTimeout(Duration.ofSeconds(5))
				.setReadTimeout(Duration.ofSeconds(120))
				.build();
		this.serverPort = serverPort;
	}

	public boolean isEnabled() {
		return kitTestProperties.isEnabled();
	}

	public Map<String, Object> runAll() {
		Instant started = Instant.now();
		List<Map<String, Object>> tests = new ArrayList<>();
		tests.add(runTimed("live-canton-health", "Canton health probe", "live", this::testHealthProbe));
		tests.add(runTimed("live-canton-status", "Canton status + ledger backend", "live", this::testCantonStatus));
		tests.add(runTimed("live-capital-market", "Capital market template catalog", "live", this::testCapitalMarketCatalog));
		tests.add(runTimed("live-reconciliation", "Ledger reconciliation report", "live", this::testReconciliation));
		tests.add(runTimed("integration-internal-mint", "Internal mint API (HTTP POST /mint)", "integration", this::testInternalMintHttp));
		tests.add(runTimed("integration-mint-policy", "Mint kit test policy", "integration", this::testMintPolicy));
		tests.add(runTimed("integration-idempotent-mint", "Idempotent mint retry", "integration", this::testIdempotentMint));
		tests.add(runTimed("integration-verify-mint", "Verify minted policy", "integration", this::testVerifyMint));
		tests.add(runTimed("integration-daml-capital-demo", "Daml CapitalMarketDemo script", "integration", this::testDamlCapitalMarketDemo));

		int passed = tests.stream().mapToInt(t -> Boolean.TRUE.equals(t.get("pass")) ? 1 : 0).sum();
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("startedAt", started.toString());
		body.put("durationMs", Duration.between(started, Instant.now()).toMillis());
		body.put("tests", tests);
		body.put("passed", passed);
		body.put("failed", tests.size() - passed);
		body.put("total", tests.size());
		body.put("cantonLive", cantonPolicyMintService.isActive());
		return body;
	}

	private Map<String, Object> runTimed(String id, String name, String category, TestStep step) {
		Instant start = Instant.now();
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("id", id);
		row.put("name", name);
		row.put("category", category);
		try {
			StepResult result = step.run();
			row.put("pass", result.pass());
			row.put("message", result.message());
		}
		catch (Exception ex) {
			row.put("pass", false);
			row.put("message", ex.getMessage() == null ? "error" : ex.getMessage());
		}
		row.put("durationMs", Duration.between(start, Instant.now()).toMillis());
		return row;
	}

	private StepResult testHealthProbe() {
		Map<String, Object> probe = healthProbe.probe();
		String status = str(probe.get("status"));
		boolean orchestratorUp = Boolean.TRUE.equals(probe.get("orchestratorUp"));
		boolean reachable = Boolean.TRUE.equals(probe.get("reachable"));
		boolean live = Boolean.TRUE.equals(probe.get("live"));
		if (!orchestratorUp) {
			return StepResult.fail("orchestrator probe missing orchestratorUp flag");
		}
		if (!StringUtils.hasText(status)) {
			return StepResult.fail("health response missing status");
		}
		if (live) {
			return StepResult.ok("status=ok, Canton live, reachable=" + reachable);
		}
		if (reachable) {
			return StepResult.ok("status=" + status + ", reachable but mint adapter not live (check GCUL_CANTON_ENABLED)");
		}
		return StepResult.ok("status=" + status + ", orchestrator up — Canton JSON API offline (simulated mint only)");
	}

	private StepResult testCantonStatus() {
		Map<String, Object> status = new LinkedHashMap<>(cantonPolicyMintService.status());
		status.put("ledgerBackend", "canton");
		if (!status.containsKey("enabled")) {
			return StepResult.fail("missing enabled field");
		}
		Object live = status.get("live");
		Object reachable = status.get("reachable");
		return StepResult.ok("ledgerBackend=canton, live=" + live + ", reachable=" + reachable);
	}

	private StepResult testCapitalMarketCatalog() {
		Map<String, Object> catalog = capitalMarketService.status();
		if (!"D".equals(str(catalog.get("phase")))) {
			return StepResult.fail("phase=" + catalog.get("phase"));
		}
		Object templates = catalog.get("templates");
		int count = templates instanceof List<?> list ? list.size() : 0;
		if (count < 4) {
			return StepResult.fail("templates=" + count);
		}
		return StepResult.ok("phase=D, templates=" + count + ", demo=" + catalog.get("demoScript"));
	}

	private StepResult testReconciliation() {
		Map<String, Object> report = reconciliationService.runReport();
		if (!report.containsKey("drifts") || !report.containsKey("status")) {
			return StepResult.fail("unexpected report shape");
		}
		String status = str(report.get("status"));
		Object driftCount = report.get("driftCount");
		return StepResult.ok("status=" + status + ", driftCount=" + driftCount);
	}

	private StepResult testInternalMintHttp() {
		String policyId = uniquePolicyId();
		Map<String, Object> body = mintPayload(policyId);

		if (internalApiProperties.isProtectionEnabled()) {
			int unauthorized = postMint(body, null);
			if (unauthorized != 401) {
				return StepResult.fail("expected 401 without internal key, got " + unauthorized);
			}
			int authorized = postMint(body, internalApiProperties.getKey());
			if (authorized != 200) {
				return StepResult.fail("expected 200 with internal key, got " + authorized);
			}
			return StepResult.ok("internal auth enforced; mint HTTP " + authorized + " for " + policyId);
		}

		int code = postMint(body, null);
		if (code != 200) {
			return StepResult.fail("mint HTTP " + code);
		}
		return StepResult.ok("open internal mint (local dev), HTTP 200 for " + policyId);
	}

	private StepResult testMintPolicy() {
		String policyId = uniquePolicyId();
		PolicyNftMintResult result = policyMintService.mintFromApi(mintPayload(policyId));
		if (!"MINTED".equalsIgnoreCase(result.mintStatus())) {
			return StepResult.fail("mintStatus=" + result.mintStatus());
		}
		if (!StringUtils.hasText(result.ledgerMode())) {
			return StepResult.fail("missing ledger_mode");
		}
		if (cantonPolicyMintService.isActive()) {
			if (!"canton".equalsIgnoreCase(result.ledgerMode())) {
				return StepResult.fail("Canton live but ledger_mode=" + result.ledgerMode());
			}
			return StepResult.ok("Canton mint MINTED, tokenId=" + shorten(result.tokenId()));
		}
		return StepResult.ok("mint MINTED (simulated), ledger_mode=" + result.ledgerMode());
	}

	private StepResult testIdempotentMint() {
		String policyId = uniquePolicyId();
		Map<String, Object> payload = mintPayload(policyId);
		PolicyNftMintResult first = policyMintService.mintFromApi(payload);
		PolicyNftMintResult second = policyMintService.mintFromApi(payload);
		if (!Objects.equals(first.tokenId(), second.tokenId())) {
			return StepResult.fail("tokenId changed on retry");
		}
		return StepResult.ok("same tokenId on retry: " + shorten(first.tokenId()));
	}

	private StepResult testVerifyMint() {
		String policyId = uniquePolicyId();
		Map<String, Object> payload = mintPayload(policyId);
		PolicyNftMintResult result = policyMintService.mintFromApi(payload);
		LedgerAdapter adapter = ledgerRegistry.requireAdapter(result.mode());
		Map<String, Object> verify = adapter.verify(policyId, result.policyReferenceHash())
				.orElse(Map.of("verified", false));
		Map<String, Object> enriched = LedgerAttestation.enrichVerify(verify, cantonProperties, result.mode());
		boolean verified = Boolean.TRUE.equals(enriched.get("verified"));
		String ledgerMode = str(enriched.get("ledger_mode"));
		if (cantonPolicyMintService.isActive()) {
			if (!verified) {
				return StepResult.fail("Canton live but verify.verified=false");
			}
			return StepResult.ok("verified=true, ledger_mode=" + ledgerMode);
		}
		if (!StringUtils.hasText(ledgerMode)) {
			return StepResult.fail("missing ledger_mode on verify");
		}
		return StepResult.ok("verify honest offline, ledger_mode=" + ledgerMode + ", verified=" + verified);
	}

	private StepResult testDamlCapitalMarketDemo() {
		if (!cantonPolicyMintService.isActive()) {
			return StepResult.fail("Canton not live — start local-dev.cmd canton before Daml script test");
		}
		CantonDamlScriptRunner.ScriptRunResult run = damlScriptRunner.runCapitalMarketDemo();
		if (!run.success()) {
			return StepResult.fail(run.message());
		}
		return StepResult.ok(run.message());
	}

	private int postMint(Map<String, Object> body, String internalKey) {
		String url = "http://127.0.0.1:" + serverPort + "/api/blockchain/internal/policy-nft/mint";
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		if (StringUtils.hasText(internalKey)) {
			headers.set(InternalApiAuthFilter.HEADER_NAME, internalKey);
		}
		try {
			ResponseEntity<String> response = restTemplate.exchange(
					url,
					HttpMethod.POST,
					new HttpEntity<>(body, headers),
					String.class);
			return response.getStatusCode().value();
		}
		catch (RestClientResponseException ex) {
			return ex.getStatusCode().value();
		}
	}

	private Map<String, Object> mintPayload(String policyId) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("policyId", policyId);
		payload.put("policyNumber", policyId);
		payload.put("customerId", "KIT-TEST-CUSTOMER");
		payload.put("walletAddress", KIT_WALLET);
		payload.put("policyReferenceHash", "kit-ref-" + policyId);
		payload.put("metadataURI", "ipfs://kit-test/" + policyId);
		payload.put("kycVerified", true);
		payload.put("policyEligible", true);
		return payload;
	}

	private static String uniquePolicyId() {
		return "KIT-TEST-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static String shorten(String value) {
		if (!StringUtils.hasText(value)) {
			return "—";
		}
		String trimmed = value.trim();
		return trimmed.length() > 24 ? trimmed.substring(0, 24) + "…" : trimmed;
	}

	private interface TestStep {
		StepResult run();
	}

	private record StepResult(boolean pass, String message) {
		static StepResult ok(String message) {
			return new StepResult(true, message);
		}

		static StepResult fail(String message) {
			return new StepResult(false, message);
		}
	}
}
